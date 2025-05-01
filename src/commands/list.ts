import chalk from "chalk";
import arg from "arg";
import { getConfig } from "../utils/config";
import { checkRuleStatus } from "../utils/rule-status";
import { detectRuleType } from "../utils/rule-detector";

export function listCommand(): void {
  // Parse command-specific arguments
  const args = arg(
    {},
    {
      permissive: true,
      argv: process.argv.slice(3), // Skip the first two args and the command name
    },
  );

  try {
    // Load configuration
    const config = getConfig();

    if (!config) {
      console.log(chalk.red("Configuration file not found!"));
      console.log(`Run ${chalk.blue("npx rules-manager init")} to create one.`);
      return;
    }

    // Check if rules are defined
    if (!config.rules || Object.keys(config.rules).length === 0) {
      console.log(chalk.yellow("No rules defined in configuration."));
      console.log(`Edit your ${chalk.blue("rules.json")} file to add rules.`);
      return;
    }

    console.log(chalk.blue("Configured Rules:"));
    console.log(chalk.dim("─".repeat(50)));

    // List each rule
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
  } catch (error) {
    console.error(chalk.red("Error listing rules:"), error);
  }
}

// Helper function to get installation path (simplified for brevity)
function getInstallPath(
  ruleName: string,
  ruleType: string,
  ide: string,
): string {
  if (ide === "cursor") {
    return `.cursor/rules/${ruleName}.mdc`;
  }
  return "Unknown location";
}
