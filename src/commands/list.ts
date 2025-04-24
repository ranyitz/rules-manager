import chalk from "chalk";
import arg from "arg";
import { getConfig } from "../utils/config";
import { checkRuleStatus } from "../utils/rule-status";

export function listCommand(): void {
  // Parse command-specific arguments
  const args = arg(
    {
      "--verbose": Boolean,
      "-v": "--verbose",
    },
    {
      permissive: true,
      argv: process.argv.slice(3), // Skip the first two args and the command name
    }
  );

  const verbose = args["--verbose"] || false;

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

      // Show additional details if verbose mode is enabled
      if (verbose) {
        console.log(`  IDEs: ${config.ides.join(", ")}`);
        if (status) {
          console.log(
            `  Installation Path: ${getInstallPath(
              ruleName,
              rule.type,
              config.ides[0]
            )}`
          );
        }
      }

      console.log(chalk.dim("─".repeat(50)));
    }
  } catch (error) {
    console.error(chalk.red("Error listing rules:"));
    console.error(error);
  }
}

// Helper function to get installation path (placeholder - implement as needed)
function getInstallPath(
  ruleName: string,
  ruleType: string,
  ide: string
): string {
  const projectDir = process.cwd(); // Get current working directory (project root)

  if (ide === "cursor") {
    return `${projectDir}/.cursor/rules/${ruleName}.mdc`;
  } else if (ide === "windsurf") {
    return `${projectDir}/.windsurf/.windsurfrules`;
  }

  return "Unknown path";
}
