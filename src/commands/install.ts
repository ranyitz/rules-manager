import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import arg from "arg";
import {
  getConfig,
  saveConfig,
  loadPreset,
  getRuleSource,
} from "../utils/config";
import { installNpmRule } from "../resolvers/npm-resolver";
import { installLocalRule } from "../resolvers/local-resolver";
import { detectRuleType } from "../utils/rule-detector";
import { Config } from "../types";

// Default configuration
const defaultConfig: Config = {
  ides: ["cursor"],
  rules: {},
  presets: [],
};

export async function installCommand(): Promise<void> {
  // Parse command-specific arguments
  const args = arg(
    {
      // Removed flags as we'll infer the type from the source
    },
    {
      permissive: true,
      argv: process.argv.slice(3), // Skip the first two args and the command name
    }
  );

  // Get rule name and source if provided
  const ruleName = args._.length > 0 ? args._[0] : null;
  const ruleSource = args._.length > 1 ? args._[1] : null;

  try {
    // If a rule name and source are provided, install directly
    if (ruleName && ruleSource) {
      console.log(`Installing rule ${ruleName} from ${ruleSource}...`);

      // Detect rule type from the source string
      const ruleType = detectRuleType(ruleSource);

      // Create config file if it doesn't exist
      let config = getConfig();
      if (!config) {
        config = { ...defaultConfig };
        console.log(
          chalk.blue("Configuration file not found. Creating a new one...")
        );
      }

      // Add the rule to the config
      config.rules[ruleName] = ruleSource;

      // Save the updated config
      saveConfig(config);
      console.log(chalk.green("Configuration updated successfully!"));

      // Install the rule based on its type
      switch (ruleType) {
        case "npm":
          await installNpmRule(ruleName, ruleSource, config.ides);
          break;
        case "local":
          await installLocalRule(ruleName, ruleSource, config.ides);
          break;
        default:
          console.log(chalk.yellow(`Unknown rule type: ${ruleType}`));
      }

      console.log(chalk.green("\nRule installation complete!"));
      return;
    }

    // Load configuration
    let config = getConfig();

    // If config doesn't exist, create a new one
    if (!config) {
      config = { ...defaultConfig };
      console.log(
        chalk.blue("Configuration file not found. Creating a new one...")
      );
      saveConfig(config);
      console.log(
        chalk.green("Empty configuration file created successfully!")
      );
      console.log(chalk.yellow("No rules defined in configuration."));
      console.log(
        `Edit your ${chalk.blue(
          "rules-manager.json"
        )} file to add rules or use the direct install command: npx rules-manager install <rule-name> <rule-source>`
      );
      return;
    }

    // Check if rules are defined (either directly or through presets)
    if (!config.rules || Object.keys(config.rules).length === 0) {
      // If there are no presets defined either, show a message
      if (!config.presets || config.presets.length === 0) {
        console.log(chalk.yellow("No rules defined in configuration."));
        console.log(
          `Edit your ${chalk.blue(
            "rules-manager.json"
          )} file to add rules or use the direct install command: npx rules-manager install <rule-name> <rule-source>`
        );
        return;
      }
    }

    if (config.presets && config.presets.length > 0) {
      let hasValidPresets = false;
      for (const preset of config.presets) {
        const presetRules = loadPreset(preset);
        if (!presetRules) {
          console.log(chalk.yellow(`    Error loading preset: ${preset}`));
        } else {
          hasValidPresets = true;
        }
      }

      // If no valid presets and no direct rules, exit
      if (
        !hasValidPresets &&
        (!config.rules || Object.keys(config.rules).length === 0)
      ) {
        console.log(
          chalk.yellow("\nNo valid rules found in configuration or presets.")
        );
        return;
      }
    }

    // Process each rule (or just the specific one if provided)
    for (const [name, source] of Object.entries(config.rules)) {
      // Skip if a specific rule was requested and this isn't it
      if (ruleName && name !== ruleName) {
        continue;
      }

      // Detect rule type from the source string
      const ruleType = detectRuleType(source);

      switch (ruleType) {
        case "npm":
          installNpmRule(name, source, config.ides);
          break;
        case "local":
          // Get the source preset path if this rule came from a preset
          const ruleSource = getRuleSource(config, name);
          installLocalRule(name, source, config.ides, ruleSource);
          break;
        default:
          console.log(chalk.yellow(`Unknown rule type: ${ruleType}`));
      }
    }

    // If a specific rule was requested but not found
    if (ruleName && !Object.keys(config.rules).includes(ruleName)) {
      console.log(
        chalk.yellow(`Rule "${ruleName}" not found in configuration.`)
      );
      return;
    }

    console.log(chalk.green("\nRules installation completed!"));
  } catch (error) {
    console.error(
      chalk.red(
        `Error during rule installation: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    );
  }
}
