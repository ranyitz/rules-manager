import fs from "fs-extra";
import path from "node:path";
import { Config, Rules } from "../types";
import { cosmiconfigSync } from "cosmiconfig";

// Metadata about rules and their sources
export interface RuleMetadata {
  ruleSources: Record<string, string>;
  originalPresetPaths: Record<string, string>;
}

// Return type for config operations that includes both config and metadata
export interface ConfigResult {
  config: Config;
  metadata: RuleMetadata;
}

const CONFIG_FILE = "aicm.json";

export interface PresetPathInfo {
  fullPath: string;
  originalPath: string;
}

export function getFullPresetPath(presetPath: string): PresetPathInfo | null {
  // If it's a local file with .json extension and exists, return as is
  if (presetPath.endsWith(".json") && fs.pathExistsSync(presetPath)) {
    return { fullPath: presetPath, originalPath: presetPath };
  }

  try {
    let absolutePresetPath;

    // Handle npm package with explicit JSON path
    if (presetPath.endsWith(".json")) {
      absolutePresetPath = require.resolve(presetPath, {
        paths: [__dirname, process.cwd()],
      });
    }
    // Handle npm package without explicit JSON path (add aicm.json)
    else {
      // For npm packages, ensure we properly handle scoped packages (@org/pkg)
      const presetPathWithConfig = path.join(presetPath, "aicm.json");
      try {
        absolutePresetPath = require.resolve(presetPathWithConfig, {
          paths: [__dirname, process.cwd()],
        });
      } catch {
        // If direct resolution fails, try as a package name
        absolutePresetPath = require.resolve(presetPath, {
          paths: [__dirname, process.cwd()],
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
 * Load a preset file and return its rules and mcpServers
 */
export function loadPreset(
  presetPath: string,
): { rules: Rules; mcpServers?: import("../types").MCPServers } | null {
  const pathInfo = getFullPresetPath(presetPath);

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

  if (!preset.rules || typeof preset.rules !== "object") {
    throw new Error(
      `Error loading preset: Invalid format in ${presetPath} - missing or invalid 'rules' object`,
    );
  }

  return { rules: preset.rules, mcpServers: preset.mcpServers };
}

// Global metadata storage
let currentMetadata: RuleMetadata | null = null;

/**
 * Process presets and return a new config with merged rules and metadata
 */
function processPresets(config: Config): ConfigResult {
  // Create a deep copy of the config to avoid mutations
  const newConfig: Config = JSON.parse(JSON.stringify(config));
  const metadata: RuleMetadata = {
    ruleSources: {},
    originalPresetPaths: {},
  };

  if (!newConfig.presets || !Array.isArray(newConfig.presets)) {
    return { config: newConfig, metadata };
  }

  for (const presetPath of newConfig.presets) {
    const preset = loadPreset(presetPath);
    if (!preset) continue;

    const pathInfo = getFullPresetPath(presetPath);
    if (!pathInfo) continue;

    const { updatedConfig, updatedMetadata } = mergePresetRules(
      newConfig,
      preset.rules,
      pathInfo,
      metadata,
    );

    Object.assign(newConfig.rules, updatedConfig.rules);
    Object.assign(metadata.ruleSources, updatedMetadata.ruleSources);
    Object.assign(
      metadata.originalPresetPaths,
      updatedMetadata.originalPresetPaths,
    );

    if (preset.mcpServers) {
      newConfig.mcpServers = mergePresetMcpServers(
        newConfig.mcpServers || {},
        preset.mcpServers,
      );
    }
  }

  return { config: newConfig, metadata };
}

/**
 * Merge preset rules into the config without mutation
 */
function mergePresetRules(
  config: Config,
  presetRules: Rules,
  pathInfo: PresetPathInfo,
  metadata: RuleMetadata,
): { updatedConfig: Config; updatedMetadata: RuleMetadata } {
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
export function loadAicmConfigCosmiconfig(): Config | null {
  const explorer = cosmiconfigSync("aicm", {
    searchPlaces: ["package.json", "aicm.json"],
  });

  try {
    const result = explorer.search();
    if (!result || !result.config) return null;
    const config = result.config as Config;
    if (!config.rules) config.rules = {};
    if (!config.ides) config.ides = ["cursor"];
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
export function getConfig(): Config | null {
  const config = loadAicmConfigCosmiconfig();
  if (!config) {
    throw new Error(
      `No config found in ${process.cwd()}, create one using "aicm init"`,
    );
  }
  const { config: processedConfig, metadata } = processPresets(config);
  // Store metadata for later access
  currentMetadata = metadata;
  return processedConfig;
}

/**
 * Get the source preset path for a rule if it came from a preset
 */
export function getRuleSource(
  config: Config,
  ruleName: string,
): string | undefined {
  return currentMetadata?.ruleSources?.[ruleName];
}

/**
 * Get the original preset path for a rule if it came from a preset
 */
export function getOriginalPresetPath(
  config: Config,
  ruleName: string,
): string | undefined {
  return currentMetadata?.originalPresetPaths?.[ruleName];
}

/**
 * Save the configuration to the aicm.json file
 */
export function saveConfig(config: Config): boolean {
  const configPath = path.join(process.cwd(), CONFIG_FILE);

  try {
    fs.writeJsonSync(configPath, config, { spaces: 2 });
    return true;
  } catch (error) {
    console.error("Error writing configuration file:", error);
    return false;
  }
}
