import chalk from "chalk";
import { getConfig } from "../utils/config";
import { checkRuleStatus } from "../utils/rule-status";
import { detectRuleType } from "../utils/rule-detector";

export function listCommand(): void {
  const config = getConfig();

  if (!config) {
    console.log(chalk.red("Configuration file not found!"));
    console.log(`Run ${chalk.blue("npx aicm init")} to create one.`);
    return;
  }

  if (!config.rules || Object.keys(config.rules).length === 0) {
    console.log(chalk.yellow("No rules defined in configuration."));
    console.log(`Edit your ${chalk.blue("rules.json")} file to add rules.`);
    return;
  }

  console.log(chalk.blue("Configured Rules:"));
  console.log(chalk.dim("─".repeat(50)));

  for (const [ruleName, source] of Object.entries(config.rules)) {
    const ruleType = detectRuleType(source);
    const status = checkRuleStatus(ruleName, ruleType, config.ides);
    const statusColor = status
      ? chalk.green("Installed")
      : chalk.yellow("Not installed");

    console.log(`${chalk.bold(ruleName)}`);
    console.log(`  Source: ${source}`);
    console.log(`  Type: ${ruleType} (auto-detected)`);
    console.log(`  Status: ${statusColor}`);

    console.log(chalk.dim("─".repeat(50)));
  }
}
