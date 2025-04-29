import fs from "fs-extra";
import path from "node:path";
import { Config, Rules } from "../types";

// Extended rule information with source file path for presets
interface RuleInfo {
  path: string;  // The rule path
  source?: string; // The source preset file path if from a preset
}
import { detectRuleType } from "./rule-detector";

const CONFIG_FILE = "rules-manager.json";

/**
 * Get the configuration from the rules-manager.json file
 */
/**
 * Load a preset file and extract its rules
 */
export function loadPreset(presetPath: string): Rules | null {
  try {
    // Determine if the preset is from an npm package or a local file
    const ruleType = detectRuleType(presetPath);
    let fullPresetPath = presetPath;
    
    if (ruleType === "npm") {
      try {
        // For npm packages, resolve from node_modules
        fullPresetPath = require.resolve(presetPath, { paths: [process.cwd()] });
      } catch (error) {
        // Try a direct path approach for tests
        const directPath = path.join(process.cwd(), "node_modules", presetPath);
        if (fs.existsSync(directPath)) {
          fullPresetPath = directPath;
        } else {
          console.error(`Error loading preset from npm package: ${presetPath}`);
          console.error(`Make sure the package is installed in your project.`);
          return null;
        }
      }
    } else {
      // For local files, resolve from current directory
      fullPresetPath = path.resolve(process.cwd(), presetPath);
    }
    
    if (!fs.existsSync(fullPresetPath)) {
      console.error(`Error loading preset: File not found: ${presetPath}`);
      return null;
    }
    
    const presetContent = fs.readFileSync(fullPresetPath, "utf8");
    let preset;
    
    try {
      preset = JSON.parse(presetContent);
    } catch (error) {
      console.error(`Error loading preset: Invalid JSON in ${presetPath}`);
      return null;
    }
    
    if (!preset.rules || typeof preset.rules !== "object") {
      console.error(`Error loading preset: Invalid format in ${presetPath} - missing or invalid 'rules' object`);
      return null;
    }
    
    return preset.rules;
  } catch (error) {
    console.error(`Error loading preset ${presetPath}:`, error);
    return null;
  }
}

/**
 * Get the configuration from the rules-manager.json file and merge with any presets
 */
export function getConfig(): Config | null {
  const configPath = path.join(process.cwd(), CONFIG_FILE);

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const configContent = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(configContent) as Config;
    
    // Initialize rules object if it doesn't exist
    if (!config.rules) {
      config.rules = {};
    }
    
    // Process presets if they exist
    if (config.presets && Array.isArray(config.presets)) {
      for (const presetPath of config.presets) {
        const presetRules = loadPreset(presetPath);
        
        if (presetRules) {
          // For each rule in the preset, store the preset path as source
          // This will be used for resolving relative paths correctly
          const fullPresetPath = getFullPresetPath(presetPath);
          
          if (fullPresetPath) {
            // Add preset rules, but don't override existing rules
            for (const [ruleName, rulePath] of Object.entries(presetRules)) {
              // Only add if not already defined in config
              if (!config.rules[ruleName]) {
                config.rules[ruleName] = rulePath;
                
                // Store the source preset path in metadata
                // We'll use this later when installing the rule
                (config as any).__ruleSources = (config as any).__ruleSources || {};
                (config as any).__ruleSources[ruleName] = fullPresetPath;
              }
            }
          }
        }
      }
    }
    
    return config;
  } catch (error) {
    console.error("Error reading configuration file:", error);
    return null;
  }
}

/**
 * Get the full path to a preset file
 */
export function getFullPresetPath(presetPath: string): string | null {
  try {
    const ruleType = detectRuleType(presetPath);
    let fullPresetPath = presetPath;
    
    if (ruleType === "npm") {
      try {
        fullPresetPath = require.resolve(presetPath, { paths: [process.cwd()] });
      } catch (error) {
        const directPath = path.join(process.cwd(), "node_modules", presetPath);
        if (fs.existsSync(directPath)) {
          fullPresetPath = directPath;
        } else {
          return null;
        }
      }
    } else {
      fullPresetPath = path.resolve(process.cwd(), presetPath);
    }
    
    return fs.existsSync(fullPresetPath) ? fullPresetPath : null;
  } catch (error) {
    return null;
  }
}

/**
 * Get the source preset path for a rule if it came from a preset
 */
export function getRuleSource(config: Config, ruleName: string): string | undefined {
  return (config as any).__ruleSources?.[ruleName];
}

/**
 * Save the configuration to the rules-manager.json file
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
