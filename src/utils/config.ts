import fs from "fs-extra";
import path from "node:path";
import { Config, NormalizedConfig, Rules } from "../types";
import { cosmiconfig } from "cosmiconfig";
import { expandRulesGlobPatterns } from "./glob-handler";

// Metadata about rules and their sources
export interface RuleMetadata {
  ruleSources: Record<string, string>;
  originalPresetPaths: Record<string, string>;
}

// Return type for config operations that includes both config and metadata
export interface ConfigResult {
  config: NormalizedConfig;
  metadata: RuleMetadata;
}

const CONFIG_FILE = "aicm.json";

export function normalizeRules(rules: Rules | string | undefined): Rules {
  if (!rules) return {};
  if (typeof rules === "string") {
    return { "/": rules };
  }
  return rules;
}

export interface PresetPathInfo {
  fullPath: string;
  originalPath: string;
}

export function getFullPresetPath(
  presetPath: string,
  cwd?: string,
): PresetPathInfo | null {
  const workingDir = cwd || process.cwd();

  // If it's a local file with .json extension, check relative to the working directory
  if (presetPath.endsWith(".json")) {
    const absolutePath = path.isAbsolute(presetPath)
      ? presetPath
      : path.resolve(workingDir, presetPath);
    if (fs.pathExistsSync(absolutePath)) {
      return { fullPath: absolutePath, originalPath: presetPath };
    }
  }

  try {
    let absolutePresetPath;

    // Handle npm package with explicit JSON path
    if (presetPath.endsWith(".json")) {
      absolutePresetPath = require.resolve(presetPath, {
        paths: [__dirname, workingDir],
      });
    }
    // Handle npm package without explicit JSON path (add aicm.json)
    else {
      // For npm packages, ensure we properly handle scoped packages (@org/pkg)
      const presetPathWithConfig = path.join(presetPath, "aicm.json");
      try {
        absolutePresetPath = require.resolve(presetPathWithConfig, {
          paths: [__dirname, workingDir],
        });
      } catch {
        // If direct resolution fails, try as a package name
        absolutePresetPath = require.resolve(presetPath, {
          paths: [__dirname, workingDir],
        });
        // If we found the package but not the config file, look for aicm.json
        if (fs.existsSync(absolutePresetPath)) {
          const packageDir = path.dirname(absolutePresetPath);
          const configPath = path.join(packageDir, "aicm.json");
          if (fs.existsSync(configPath)) {
            absolutePresetPath = configPath;
          }
        }
      }
    }

    return fs.existsSync(absolutePresetPath)
      ? { fullPath: absolutePresetPath, originalPath: presetPath }
      : null;
  } catch {
    return null;
  }
}

/**
 * Load a preset file and return its contents
 */
export function loadPreset(
  presetPath: string,
  cwd?: string,
): {
  rules: Rules;
  mcpServers?: import("../types").MCPServers;
  presets?: string[];
} | null {
  const pathInfo = getFullPresetPath(presetPath, cwd);

  if (!pathInfo) {
    throw new Error(
      `Error loading preset: "${presetPath}". Make sure the package is installed in your project.`,
    );
  }

  const presetContent = fs.readFileSync(pathInfo.fullPath, "utf8");
  let preset;

  try {
    preset = JSON.parse(presetContent);
  } catch (error: unknown) {
    const parseError = error as SyntaxError;
    throw new Error(
      `Error loading preset: Invalid JSON in ${presetPath}: ${parseError.message}`,
    );
  }

  if (!preset.rules) {
    throw new Error(
      `Error loading preset: Invalid format in ${presetPath} - missing or invalid 'rules' object`,
    );
  }

  const normalizedRules = normalizeRules(preset.rules);

  return {
    rules: normalizedRules,
    mcpServers: preset.mcpServers,
    presets: preset.presets,
  };
}

// Global metadata storage
let currentMetadata: RuleMetadata | null = null;

// Track processed presets to avoid circular references
const processedPresets = new Set<string>();

/**
 * Process presets and return a new config with merged rules and metadata
 */
async function processPresets(
  config: NormalizedConfig,
  cwd?: string,
): Promise<ConfigResult> {
  // Create a deep copy of the config to avoid mutations
  const newConfig: NormalizedConfig = JSON.parse(JSON.stringify(config));
  const metadata: RuleMetadata = {
    ruleSources: {},
    originalPresetPaths: {},
  };

  // Clear processed presets tracking set when starting from the top level
  processedPresets.clear();

  return await processPresetsInternal(newConfig, metadata, cwd);
}

/**
 * Internal function to process presets recursively
 */
async function processPresetsInternal(
  config: NormalizedConfig,
  metadata: RuleMetadata,
  cwd?: string,
): Promise<ConfigResult> {
  if (!config.presets || !Array.isArray(config.presets)) {
    return { config, metadata };
  }

  for (const presetPath of config.presets) {
    const pathInfo = getFullPresetPath(presetPath, cwd);

    if (!pathInfo) {
      throw new Error(
        `Error loading preset: "${presetPath}". Make sure the package is installed in your project.`,
      );
    }

    // Skip if we've already processed this preset (prevents circular references)
    if (processedPresets.has(pathInfo.fullPath)) {
      // Skip duplicates to prevent circular references
      continue;
    }

    // Mark this preset as processed
    processedPresets.add(pathInfo.fullPath);

    const preset = loadPreset(presetPath, cwd);
    if (!preset) continue;

    // Expand glob patterns within the preset using its base directory
    const presetDir = path.dirname(pathInfo.fullPath);
    const expansion = await expandRulesGlobPatterns(preset.rules, presetDir);
    preset.rules = expansion.expandedRules;

    // Process nested presets first (depth-first)
    if (preset.presets && preset.presets.length > 0) {
      // Create a temporary config with just the presets from this preset
      const presetConfig: NormalizedConfig = {
        rules: {},
        presets: preset.presets,
        ides: [],
      };

      // Recursively process the nested presets
      const { config: nestedConfig } = await processPresetsInternal(
        presetConfig,
        metadata,
        cwd,
      );

      Object.assign(preset.rules, nestedConfig.rules);
    }

    const { updatedConfig, updatedMetadata } = mergePresetRules(
      config,
      preset.rules,
      pathInfo,
      metadata,
    );

    Object.assign(config.rules, updatedConfig.rules);
    Object.assign(metadata.ruleSources, updatedMetadata.ruleSources);
    Object.assign(
      metadata.originalPresetPaths,
      updatedMetadata.originalPresetPaths,
    );

    if (preset.mcpServers) {
      config.mcpServers = mergePresetMcpServers(
        config.mcpServers || {},
        preset.mcpServers,
      );
    }
  }

  return { config, metadata };
}

/**
 * Merge preset rules into the config without mutation
 */
function mergePresetRules(
  config: NormalizedConfig,
  presetRules: Rules,
  pathInfo: PresetPathInfo,
  metadata: RuleMetadata,
): { updatedConfig: NormalizedConfig; updatedMetadata: RuleMetadata } {
  const updatedRules = { ...config.rules };
  const updatedMetadata = {
    ruleSources: { ...metadata.ruleSources },
    originalPresetPaths: { ...metadata.originalPresetPaths },
  };

  for (const [ruleName, rulePath] of Object.entries(presetRules)) {
    // Cancel if set to false in config
    if (
      Object.prototype.hasOwnProperty.call(config.rules, ruleName) &&
      config.rules[ruleName] === false
    ) {
      delete updatedRules[ruleName];
      delete updatedMetadata.ruleSources[ruleName];
      delete updatedMetadata.originalPresetPaths[ruleName];
      continue;
    }
    // Only add if not already defined in config (override handled by config)
    if (!Object.prototype.hasOwnProperty.call(config.rules, ruleName)) {
      updatedRules[ruleName] = rulePath;
      updatedMetadata.ruleSources[ruleName] = pathInfo.fullPath;
      updatedMetadata.originalPresetPaths[ruleName] = pathInfo.originalPath;
    }
  }

  return {
    updatedConfig: { ...config, rules: updatedRules },
    updatedMetadata,
  };
}

/**
 * Merge preset mcpServers without mutation
 */
function mergePresetMcpServers(
  configMcpServers: import("../types").MCPServers,
  presetMcpServers: import("../types").MCPServers,
): import("../types").MCPServers {
  const newMcpServers = { ...configMcpServers };

  for (const [serverName, serverConfig] of Object.entries(presetMcpServers)) {
    // Cancel if set to false in config
    if (
      Object.prototype.hasOwnProperty.call(newMcpServers, serverName) &&
      newMcpServers[serverName] === false
    ) {
      delete newMcpServers[serverName];
      continue;
    }
    // Only add if not already defined in config (override handled by config)
    if (!Object.prototype.hasOwnProperty.call(newMcpServers, serverName)) {
      newMcpServers[serverName] = serverConfig;
    }
  }

  return newMcpServers;
}

/**
 * Load the aicm config using cosmiconfigSync, supporting both aicm.json and package.json.
 * Returns the config object or null if not found.
 */
export async function loadAicmConfigCosmiconfig(
  searchFrom?: string,
): Promise<NormalizedConfig | null> {
  const explorer = cosmiconfig("aicm", {
    searchPlaces: ["package.json", "aicm.json"],
  });

  try {
    const result = await explorer.search(searchFrom);
    if (!result || !result.config) return null;
    const rawConfig = result.config as Config;
    const normalizedRules = normalizeRules(rawConfig.rules);
    const config: NormalizedConfig = {
      ...rawConfig,
      ides: rawConfig.ides || ["cursor"],
      rules: normalizedRules,
    };
    return config;
  } catch (error) {
    throw new Error(
      `Error loading aicm config: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Get the configuration from aicm.json or package.json (using cosmiconfigSync) and merge with any presets
 */
export async function getConfig(
  cwd?: string,
): Promise<NormalizedConfig | null> {
  const workingDir = cwd || process.cwd();
  const config = await loadAicmConfigCosmiconfig(workingDir);
  if (!config) {
    throw new Error(
      `No config found in ${workingDir}, create one using "aicm init"`,
    );
  }
  const { config: processedConfig, metadata } = await processPresets(
    config,
    workingDir,
  );
  // Store metadata for later access
  currentMetadata = metadata;
  return processedConfig;
}

/**
 * Get the source preset path for a rule if it came from a preset
 */
export function getRuleSource(
  config: NormalizedConfig,
  ruleName: string,
): string | undefined {
  return currentMetadata?.ruleSources?.[ruleName];
}

/**
 * Get the original preset path for a rule if it came from a preset
 */
export function getOriginalPresetPath(
  config: NormalizedConfig,
  ruleName: string,
): string | undefined {
  return currentMetadata?.originalPresetPaths?.[ruleName];
}

/**
 * Save the configuration to the aicm.json file
 */
export function saveConfig(config: Config, cwd?: string): boolean {
  const workingDir = cwd || process.cwd();
  const configPath = path.join(workingDir, CONFIG_FILE);

  try {
    fs.writeJsonSync(configPath, config, { spaces: 2 });
    return true;
  } catch (error) {
    console.error("Error writing configuration file:", error);
    return false;
  }
}
