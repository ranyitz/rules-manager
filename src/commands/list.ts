import chalk from "chalk";
import { loadConfig } from "../utils/config";

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

  for (const rule of config.rules) {
    console.log(
      `${chalk.bold(rule.name)} - ${rule.sourcePath} ${
        rule.presetName ? `[${rule.presetName}]` : ""
      }`,
    );
  }
}
