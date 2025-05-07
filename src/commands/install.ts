import chalk from "chalk";
import arg from "arg";
import { getConfig, saveConfig, getRuleSource } from "../utils/config";
import { detectRuleType } from "../utils/rule-detector";
import { Config } from "../types";
import {
  collectLocalRule,
  collectNpmRule,
  initRuleCollection,
  addRuleToCollection,
} from "../utils/rule-collector";
import { writeRulesToTargets } from "../utils/rule-writer";

// Default configuration
const defaultConfig: Config = {
  ides: ["cursor", "windsurf"],
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
    },
  );

  // Get rule name and source if provided
  const ruleName = args._.length > 0 ? args._[0] : null;
  const ruleSource = args._.length > 1 ? args._[1] : null;

  try {
    // Initialize rule collection
    const ruleCollection = initRuleCollection();

    // If a rule name and source are provided, install directly
    if (ruleName && ruleSource) {
      // Detect rule type from the source string
      const ruleType = detectRuleType(ruleSource);

      // Create config file if it doesn't exist
      let config = getConfig();
      if (!config) {
        config = { ...defaultConfig };
        console.log(
          chalk.blue("Configuration file not found. Creating a new one..."),
        );
      }

      // Add the rule to the config
      config.rules[ruleName] = ruleSource;

      // Save the updated config
      saveConfig(config);
      console.log(chalk.green("Configuration updated successfully!"));

      // Collect the rule based on its type
      let ruleContent;
      switch (ruleType) {
        case "npm":
          ruleContent = collectNpmRule(ruleName, ruleSource);
          break;
        case "local":
          ruleContent = collectLocalRule(ruleName, ruleSource);
          break;
        default:
          console.log(chalk.yellow(`Unknown rule type: ${ruleType}`));
          return;
      }

      // Add rule to collection
      addRuleToCollection(ruleCollection, ruleContent, config.ides);

      // Write rules to targets
      writeRulesToTargets(ruleCollection);

      console.log(chalk.green("\nRules installation completed!"));
      return;
    }

    // Load configuration
    let config = getConfig();

    // If config doesn't exist, create a new one
    if (!config) {
      config = { ...defaultConfig };
      console.log(
        chalk.blue("Configuration file not found. Creating a new one..."),
      );
      saveConfig(config);
      console.log(
        chalk.green("Empty configuration file created successfully!"),
      );
      console.log(chalk.yellow("No rules defined in configuration."));
      console.log(
        `Edit your ${chalk.blue(
          "rules.json",
        )} file to add rules or use the direct install command: npx aicm install <rule-name> <rule-source>`,
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
            "rules.json",
          )} file to add rules or use the direct install command: npx aicm install <rule-name> <rule-source>`,
        );
        return;
      }
    }

    if (config.presets && config.presets.length > 0) {
      const hasValidPresets = true;

      // If no valid presets and no direct rules, exit
      if (
        !hasValidPresets &&
        (!config.rules || Object.keys(config.rules).length === 0)
      ) {
        console.log(
          chalk.yellow("\nNo valid rules found in configuration or presets."),
        );
        return;
      }
    }

    // Process each rule (or just the specific one if provided)
    let hasErrors = false;
    for (const [name, source] of Object.entries(config.rules)) {
      // Skip if a specific rule was requested and this isn't it
      if (ruleName && name !== ruleName) {
        continue;
      }

      // Detect rule type from the source string
      const ruleType = detectRuleType(source);

      // Get the base path of the preset file if this rule came from a preset
      const ruleBasePath = getRuleSource(config, name);

      // Collect the rule based on its type
      try {
        let ruleContent;
        switch (ruleType) {
          case "npm":
            ruleContent = collectNpmRule(name, source);
            break;
          case "local":
            ruleContent = collectLocalRule(name, source, ruleBasePath);
            break;
          default:
            console.log(chalk.yellow(`Unknown rule type: ${ruleType}`));
            continue;
        }

        // Add rule to collection
        addRuleToCollection(ruleCollection, ruleContent, config.ides);
      } catch (error: unknown) {
        hasErrors = true;
        console.error(
          chalk.red(
            `Error processing rule ${name}: ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
        // If a specific rule was requested and it failed, exit immediately
        if (ruleName) {
          throw error;
        }
      }
    }

    // If there were errors and we're not processing a specific rule, exit with error
    if (hasErrors && !ruleName) {
      throw new Error("One or more rules failed to process");
    }

    // If a specific rule was requested but not found
    if (ruleName && !Object.keys(config.rules).includes(ruleName)) {
      console.log(
        chalk.yellow(`Rule "${ruleName}" not found in configuration.`),
      );
      return;
    }

    // Write all collected rules to their targets
    writeRulesToTargets(ruleCollection);

    console.log(chalk.green("\nRules installation completed!"));
  } catch (error: unknown) {
    console.error(
      chalk.red(
        `Error during rule installation: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ),
    );
    process.exit(1);
  }
}
