import fs from "fs-extra";
import path from "node:path";
import { Config, Rules } from "../types";
import { detectRuleType } from "./rule-detector";
import { cosmiconfigSync } from "cosmiconfig";

interface ConfigWithMeta extends Config {
  __ruleSources?: Record<string, string>;
}

const CONFIG_FILE = "aicm.json";

/**
 * Get the full path to a preset file
 */
export function getFullPresetPath(presetPath: string): string | null {
  try {
    const ruleType = detectRuleType(presetPath);
    let fullPresetPath = presetPath;

    if (ruleType === "npm") {
      try {
        fullPresetPath = require.resolve(presetPath, {
          paths: [process.cwd()],
        });
      } catch {
        const directPath = path.join(process.cwd(), "node_modules", presetPath);
        if (fs.existsSync(directPath)) {
          fullPresetPath = directPath;
        } else {
          return null;
        }
      }
    } else {
      // For local files, resolve from current directory
      fullPresetPath = path.resolve(process.cwd(), presetPath);
    }

    return fs.existsSync(fullPresetPath) ? fullPresetPath : null;
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
  const fullPresetPath = getFullPresetPath(presetPath);

  if (!fullPresetPath) {
    throw new Error(
      `Error loading preset: File not found: ${presetPath}. Make sure the package is installed in your project.`,
    );
  }

  const presetContent = fs.readFileSync(fullPresetPath, "utf8");
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

    const fullPresetPath = getFullPresetPath(presetPath);
    if (!fullPresetPath) continue;

    mergePresetRules(config, preset.rules, fullPresetPath);
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
  presetPath: string,
): void {
  for (const [ruleName, rulePath] of Object.entries(presetRules)) {
    // Cancel if set to false in config
    if (
      Object.prototype.hasOwnProperty.call(config.rules, ruleName) &&
      config.rules[ruleName] === false
    ) {
      delete config.rules[ruleName];
      if (config.__ruleSources) delete config.__ruleSources[ruleName];
      continue;
    }
    // Only add if not already defined in config (override handled by config)
    if (!Object.prototype.hasOwnProperty.call(config.rules, ruleName)) {
      config.rules[ruleName] = rulePath;
      config.__ruleSources = config.__ruleSources || {};
      config.__ruleSources[ruleName] = presetPath;
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
    return config;
  } catch (error) {
    console.error("Error loading aicm config via cosmiconfig:", error);
    return null;
  }
}

/**
 * Get the configuration from aicm.json or package.json (using cosmiconfigSync) and merge with any presets
 */
export function getConfig(): Config | null {
  const config = loadAicmConfigCosmiconfig();
  if (!config) return null;
  processPresets(config);
  return config;
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
