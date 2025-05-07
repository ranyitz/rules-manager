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
 * Load a preset file and return its rules
 */
export function loadPreset(presetPath: string): Rules | null {
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

  return preset.rules;
}

/**
 * Process presets and merge their rules into the config
 */
function processPresets(config: ConfigWithMeta): void {
  if (!config.presets || !Array.isArray(config.presets)) {
    return;
  }

  for (const presetPath of config.presets) {
    const presetRules = loadPreset(presetPath);
    if (!presetRules) continue;

    const fullPresetPath = getFullPresetPath(presetPath);
    if (!fullPresetPath) continue;

    mergePresetRules(config, presetRules, fullPresetPath);
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
  // Add preset rules, but don't override existing rules
  for (const [ruleName, rulePath] of Object.entries(presetRules)) {
    // Only add if not already defined in config
    if (!config.rules[ruleName]) {
      config.rules[ruleName] = rulePath;

      // Store the source preset path in metadata
      config.__ruleSources = config.__ruleSources || {};
      config.__ruleSources[ruleName] = presetPath;
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
