import fs from "fs-extra";
import path from "node:path";
import { Config, Rules } from "../types";
import { cosmiconfigSync } from "cosmiconfig";

interface ConfigWithMeta extends Config {
  __ruleSources?: Record<string, string>;
  __originalPresetPaths?: Record<string, string>;
}

const CONFIG_FILE = "aicm.json";

export interface PresetPathInfo {
  fullPath: string;
  originalPath: string;
}

export function getFullPresetPath(presetPath: string): PresetPathInfo | null {
  if (presetPath.endsWith(".json") && fs.pathExistsSync(presetPath)) {
    return { fullPath: presetPath, originalPath: presetPath };
  }

  try {
    let absolutePresetPath;
    if (presetPath.endsWith(".json")) {
      absolutePresetPath = require.resolve(presetPath, {
        paths: [__dirname, process.cwd()],
      });
    } else {
      const presetPathWithConfig = path.join(presetPath, "aicm.json");
      absolutePresetPath = require.resolve(presetPathWithConfig, {
        paths: [__dirname, process.cwd()],
      });
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

/**
 * Process presets and merge their rules and mcpServers into the config
 */
function processPresets(config: ConfigWithMeta): void {
  if (!config.presets || !Array.isArray(config.presets)) {
    return;
  }

  for (const presetPath of config.presets) {
    const preset = loadPreset(presetPath);
    if (!preset) continue;

    const pathInfo = getFullPresetPath(presetPath);
    if (!pathInfo) continue;

    mergePresetRules(config, preset.rules, pathInfo);
    if (preset.mcpServers) {
      mergePresetMcpServers(config, preset.mcpServers);
    }
  }
}

/**
 * Merge preset rules into the config
 */
function mergePresetRules(
  config: ConfigWithMeta,
  presetRules: Rules,
  pathInfo: PresetPathInfo,
): void {
  for (const [ruleName, rulePath] of Object.entries(presetRules)) {
    // Cancel if set to false in config
    if (
      Object.prototype.hasOwnProperty.call(config.rules, ruleName) &&
      config.rules[ruleName] === false
    ) {
      delete config.rules[ruleName];
      if (config.__ruleSources) delete config.__ruleSources[ruleName];
      if (config.__originalPresetPaths)
        delete config.__originalPresetPaths[ruleName];
      continue;
    }
    // Only add if not already defined in config (override handled by config)
    if (!Object.prototype.hasOwnProperty.call(config.rules, ruleName)) {
      config.rules[ruleName] = rulePath;
      config.__ruleSources = config.__ruleSources || {};
      config.__ruleSources[ruleName] = pathInfo.fullPath;
      config.__originalPresetPaths = config.__originalPresetPaths || {};
      config.__originalPresetPaths[ruleName] = pathInfo.originalPath;
    }
  }
}

/**
 * Merge preset mcpServers into the config
 */
function mergePresetMcpServers(
  config: ConfigWithMeta,
  presetMcpServers: import("../types").MCPServers,
): void {
  if (!config.mcpServers) config.mcpServers = {};
  for (const [serverName, serverConfig] of Object.entries(presetMcpServers)) {
    // Cancel if set to false in config
    if (
      Object.prototype.hasOwnProperty.call(config.mcpServers, serverName) &&
      config.mcpServers[serverName] === false
    ) {
      delete config.mcpServers[serverName];
      continue;
    }
    // Only add if not already defined in config (override handled by config)
    if (!Object.prototype.hasOwnProperty.call(config.mcpServers, serverName)) {
      config.mcpServers[serverName] = serverConfig;
    }
  }
}

/**
 * Load the aicm config using cosmiconfigSync, supporting both aicm.json and package.json.
 * Returns the config object or null if not found.
 */
export function loadAicmConfigCosmiconfig(): ConfigWithMeta | null {
  const explorer = cosmiconfigSync("aicm", {
    searchPlaces: ["package.json", "aicm.json"],
  });

  try {
    const result = explorer.search();
    if (!result || !result.config) return null;
    const config = result.config as ConfigWithMeta;
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
  processPresets(config);
  return config as Config;
}

/**
 * Get the source preset path for a rule if it came from a preset
 */
export function getRuleSource(
  config: Config,
  ruleName: string,
): string | undefined {
  return (config as ConfigWithMeta).__ruleSources?.[ruleName];
}

/**
 * Get the original preset path for a rule if it came from a preset
 */
export function getOriginalPresetPath(
  config: Config,
  ruleName: string,
): string | undefined {
  return (config as ConfigWithMeta).__originalPresetPaths?.[ruleName];
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
