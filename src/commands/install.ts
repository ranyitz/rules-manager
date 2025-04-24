import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import arg from "arg";
import { getConfig } from "../utils/config";
import { installUrlRule } from "../resolvers/url-resolver";
import { installNpmRule } from "../resolvers/npm-resolver";
import { installLocalRule } from "../resolvers/local-resolver";

export function installCommand(): void {
  // Parse command-specific arguments
  const args = arg(
    {
      "--force": Boolean,
      "-f": "--force",
      "--local": String,
      "-l": "--local",
    },
    {
      permissive: true,
      argv: process.argv.slice(3), // Skip the first two args and the command name
    }
  );

  // Get specific rule if provided
  const specificRule = args._.length > 0 ? args._[0] : null;
  const forceInstall = args["--force"] || false;
  const localPath = args["--local"];

  try {
    // If a rule name and local path are provided, install directly without config
    if (specificRule && localPath) {
      console.log(`Installing rule ${specificRule} from ${localPath}...`);

      // Install for Cursor and Windsurf
      installLocalRule(specificRule, localPath, ["cursor", "windsurf"]);

      return;
    }

    // Load configuration
    const config = getConfig();

    if (!config) {
      console.log(chalk.red("Configuration file not found!"));
      console.log(`Run ${chalk.blue("ai-rules init")} to create one.`);
      return;
    }

    // Check if rules are defined
    if (!config.rules || Object.keys(config.rules).length === 0) {
      console.log(chalk.yellow("No rules defined in configuration."));
      console.log(
        `Edit your ${chalk.blue("ai-rules.json")} file to add rules.`
      );
      return;
    }

    console.log(chalk.blue("Installing rules..."));

    // Process each rule (or just the specific one if provided)
    for (const [ruleName, rule] of Object.entries(config.rules)) {
      // Skip if a specific rule was requested and this isn't it
      if (specificRule && ruleName !== specificRule) {
        continue;
      }

      console.log(`\nProcessing rule: ${chalk.green(ruleName)}`);

      switch (rule.type) {
        case "url":
          installUrlRule(ruleName, rule.source, config.ides);
          break;
        case "npm":
          installNpmRule(ruleName, rule.source, config.ides);
          break;
        case "local":
          installLocalRule(ruleName, rule.source, config.ides);
          break;
        default:
          console.log(chalk.yellow(`Unknown rule type: ${rule.type}`));
      }
    }

    // If a specific rule was requested but not found
    if (specificRule && !Object.keys(config.rules).includes(specificRule)) {
      console.log(
        chalk.yellow(`Rule "${specificRule}" not found in configuration.`)
      );
      return;
    }

    console.log(chalk.green("\n✓ Rule installation complete!"));
  } catch (error) {
    console.error(chalk.red("Error installing rules:"));
    console.error(error);
  }
}
