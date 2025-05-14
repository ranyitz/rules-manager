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

/**
 * Options for the installCore function
 */
export interface InstallOptions {
  /**
   * Base directory to use instead of process.cwd()
   */
  cwd?: string;
  /**
   * Custom config object to use instead of loading from file
   */
  config?: Config;
  /**
   * Whether to log progress to console
   */
  silent?: boolean;
}

/**
 * Result of the install operation
 */
export interface InstallResult {
  /**
   * Whether the operation was successful
   */
  success: boolean;
  /**
   * Error message if the operation failed
   */
  error?: string;
  /**
   * Number of rules installed
   */
  installedRuleCount: number;
}

/**
 * Write MCP servers configuration to IDE targets
 * @param mcpServers The MCP servers configuration
 * @param ides The IDEs to write to
 * @param cwd The current working directory
 */
function writeMcpServersToTargets(
  mcpServers: Config["mcpServers"],
  ides: string[],
  cwd: string,
): void {
  if (!mcpServers) return;
  for (const ide of ides) {
    let mcpPath: string | null = null;
    if (ide === "cursor") {
      mcpPath = path.join(cwd, ".cursor", "mcp.json");
      fs.ensureDirSync(path.dirname(mcpPath));
    }
    // Windsurf does not support project mcpServers, so skip
    if (mcpPath) {
      fs.writeJsonSync(mcpPath, { mcpServers }, { spaces: 2 });
    }
  }
}

/**
 * Core implementation of the rule installation logic
 * @param options Install options
 * @returns Result of the install operation
 */
export async function install(
  options: InstallOptions = {},
): Promise<InstallResult> {
  const cwd = options.cwd || process.cwd();
  const silent = options.silent || false;
  const log = silent ? () => {} : console.log;
  const error = silent ? () => {} : console.error;

  try {
    // Save original process.cwd() and change to the specified cwd
    const originalCwd = process.cwd();
    if (cwd !== originalCwd) {
      process.chdir(cwd);
    }

    // Initialize rule collection
    const ruleCollection = initRuleCollection();

    // Use provided config or load from file
    const config = options.config || getConfig();

    // If config doesn't exist, return error
    if (!config) {
      error("Configuration file not found!");

      // Restore original cwd
      if (cwd !== originalCwd) {
        process.chdir(originalCwd);
      }

      return {
        success: false,
        error: "Configuration file not found!",
        installedRuleCount: 0,
      };
    }

    // Check if rules are defined (either directly or through presets)
    if (!config.rules || Object.keys(config.rules).length === 0) {
      // If there are no presets defined either, show a message
      if (!config.presets || config.presets.length === 0) {
        error("No rules defined in configuration.");

        // Restore original cwd
        if (cwd !== originalCwd) {
          process.chdir(originalCwd);
        }

        return {
          success: false,
          error: "No rules defined in configuration.",
          installedRuleCount: 0,
        };
      }
    }

    // Process each rule
    let hasErrors = false;
    const errorMessages: string[] = [];
    let installedRuleCount = 0;

    for (const [name, source] of Object.entries(config.rules)) {
      if (source === false) continue; // skip canceled rules
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
            error(`Unknown rule type: ${ruleType}`);
            errorMessages.push(`Unknown rule type: ${ruleType}`);
            continue;
        }

        // Add rule to collection
        addRuleToCollection(ruleCollection, ruleContent, config.ides);
        installedRuleCount++;
      } catch (e) {
        hasErrors = true;
        const errorMessage = `Error processing rule ${name}: ${e instanceof Error ? e.message : String(e)}`;
        error(errorMessage);
        errorMessages.push(errorMessage);
      }
    }

    // If there were errors, exit with error
    if (hasErrors) {
      // Restore original cwd
      if (cwd !== originalCwd) {
        process.chdir(originalCwd);
      }

      return {
        success: false,
        error: errorMessages.join("; "),
        installedRuleCount,
      };
    }

    // Write all collected rules to their targets
    writeRulesToTargets(ruleCollection);

    // Write mcpServers config to IDE targets
    if (config.mcpServers) {
      // Filter out canceled servers
      const filteredMcpServers = Object.fromEntries(
        Object.entries(config.mcpServers).filter(([, v]) => v !== false),
      );
      writeMcpServersToTargets(filteredMcpServers, config.ides, cwd);
    }

    log("Rules installation completed");

    // Restore original cwd
    if (cwd !== originalCwd) {
      process.chdir(originalCwd);
    }

    return {
      success: true,
      installedRuleCount,
    };
  } catch (e) {
    const errorMessage = `Error during rule installation: ${e instanceof Error ? e.message : String(e)}`;
    error(errorMessage);

    // If cwd was changed, restore it
    if (cwd !== process.cwd()) {
      process.chdir(cwd);
    }

    return {
      success: false,
      error: errorMessage,
      installedRuleCount: 0,
    };
  }
}

export async function installCommand(): Promise<void> {
  try {
    const result = await install({ silent: false });

    if (!result.success) {
      console.error(chalk.red(result.error));
      process.exit(1);
    }
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
