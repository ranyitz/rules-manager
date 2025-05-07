import chalk from "chalk";
import { getConfig, getRuleSource } from "../utils/config";
import { detectRuleType } from "../utils/rule-detector";
import { Config } from "../types";
import {
  collectLocalRule,
  collectNpmRule,
  initRuleCollection,
  addRuleToCollection,
} from "../utils/rule-collector";
import { writeRulesToTargets } from "../utils/rule-writer";
import fs from "fs-extra";
import path from "node:path";

function writeMcpServersToTargets(
  mcpServers: Config["mcpServers"],
  ides: string[],
) {
  if (!mcpServers) return;
  for (const ide of ides) {
    let mcpPath: string | null = null;
    if (ide === "cursor") {
      mcpPath = path.join(process.cwd(), ".cursor", "mcp.json");
      fs.ensureDirSync(path.dirname(mcpPath));
    }
    // Windsurf does not support project mcpServers, so skip
    if (mcpPath) {
      fs.writeJsonSync(mcpPath, { mcpServers }, { spaces: 2 });
    }
  }
}

export async function installCommand(): Promise<void> {
  try {
    // Initialize rule collection
    const ruleCollection = initRuleCollection();

    // Load configuration
    const config = getConfig();

    // If config doesn't exist, print error and exit
    if (!config) {
      console.error(
        chalk.red(
          "Configuration file not found! Please run 'npx aicm init' to create one.",
        ),
      );
      process.exit(1);
    }

    // Check if rules are defined (either directly or through presets)
    if (!config.rules || Object.keys(config.rules).length === 0) {
      // If there are no presets defined either, show a message
      if (!config.presets || config.presets.length === 0) {
        console.log(chalk.yellow("No rules defined in configuration."));
        console.log(`Edit your ${chalk.blue("aicm.json")} file to add rules.`);
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

    // Process each rule
    let hasErrors = false;
    for (const [name, source] of Object.entries(config.rules)) {
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
      }
    }

    // If there were errors, exit with error
    if (hasErrors) {
      throw new Error("One or more rules failed to process");
    }

    // Write all collected rules to their targets
    writeRulesToTargets(ruleCollection);

    // Write mcpServers config to IDE targets
    writeMcpServersToTargets(config.mcpServers, config.ides);

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
