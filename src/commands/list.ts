import chalk from "chalk";
import { getConfig } from "../utils/config";
import { checkRuleStatus } from "../utils/rule-status";

export function listCommand(): void {
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

    console.log(chalk.blue("Configured Rules:"));
    console.log(chalk.dim("─".repeat(50)));

    // List each rule
    for (const [ruleName, rule] of Object.entries(config.rules)) {
      const status = checkRuleStatus(ruleName, rule.type, config.ides);
      const statusColor = status
        ? chalk.green("Installed")
        : chalk.yellow("Not installed");

      console.log(`${chalk.bold(ruleName)}`);
      console.log(`  Source: ${rule.source}`);
      console.log(`  Type: ${rule.type}`);
      console.log(`  Status: ${statusColor}`);
      console.log(chalk.dim("─".repeat(50)));
    }
  } catch (error) {
    console.error(chalk.red("Error listing rules:"));
    console.error(error);
  }
}
