import chalk from "chalk";
import { loadConfig } from "../utils/config";
import { detectRuleType } from "../utils/rule-detector";
import { checkRuleStatus } from "../utils/rule-status";

export async function listCommand(): Promise<void> {
  const config = await loadConfig();

  if (!config) {
    console.log(chalk.red("Configuration file not found!"));
    console.log(`Run ${chalk.blue("npx aicm init")} to create one.`);
    return;
  }

  if (!config.rules || config.rules.length === 0) {
    console.log(chalk.yellow("No rules defined in configuration."));
    console.log(`Edit your ${chalk.blue("aicm.json")} file to add rules.`);
    return;
  }

  console.log(chalk.blue("Configured Rules:"));
  console.log(chalk.dim("─".repeat(50)));

  // Iterate over the resolved rules array
  for (const rule of config.rules) {
    const ruleType =
      rule.source === "preset" ? "preset" : detectRuleType(rule.sourcePath);
    const status = checkRuleStatus(rule.name, config.config.targets);
    const statusColor = status
      ? chalk.green("Installed")
      : chalk.yellow("Not installed");

    console.log(`${chalk.bold(rule.name)}`);
    console.log(`  Source: ${rule.sourcePath}`);
    console.log(`  Type: ${ruleType} (auto-detected)`);
    if (rule.presetName) {
      console.log(`  Preset: ${rule.presetName}`);
    }
    console.log(`  Status: ${statusColor}`);

    console.log(chalk.dim("─".repeat(50)));
  }
}
