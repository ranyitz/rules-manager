import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { getConfig } from "../utils/config";
import { installUrlRule } from "../resolvers/url-resolver";
import { installNpmRule } from "../resolvers/npm-resolver";
import { installLocalRule } from "../resolvers/local-resolver";

export function installCommand(): void {
  try {
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

    // Process each rule
    for (const [ruleName, rule] of Object.entries(config.rules)) {
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

    console.log(chalk.green("\n✓ Rule installation complete!"));
  } catch (error) {
    console.error(chalk.red("Error installing rules:"));
    console.error(error);
  }
}
