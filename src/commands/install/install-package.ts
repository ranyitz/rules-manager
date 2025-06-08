import { getConfig } from "../../utils/config";
import { NormalizedConfig } from "../../types";
import { withWorkingDirectory } from "../../utils/working-directory";
import {
  collectLocalRule,
  initRuleCollection,
  addRuleToCollection,
} from "../../utils/rule-collector";
import { writeRulesToTargets } from "../../utils/rule-writer";
import { writeMcpServersToTargets } from "../../utils/mcp-writer";

/**
 * Options for the install functions
 */
export interface InstallOptions {
  /**
   * Base directory to use instead of process.cwd()
   */
  cwd?: string;
  /**
   * Custom config object to use instead of loading from file
   */
  config?: NormalizedConfig;
  /**
   * allow installation on CI environments
   */
  installOnCI?: boolean;
  /**
   * Show verbose output during installation
   */
  verbose?: boolean;
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
   * Error stack trace for debugging (when available)
   */
  errorStack?: string;
  /**
   * Number of rules installed
   */
  installedRuleCount: number;
  /**
   * Number of packages installed
   */
  packagesCount: number;
}

/**
 * Install rules for a single package (used within workspaces and standalone installs)
 * @param options Install options
 * @returns Result of the install operation
 */
export async function installPackage(
  options: InstallOptions = {},
): Promise<InstallResult> {
  const cwd = options.cwd || process.cwd();

  return withWorkingDirectory(cwd, async () => {
    const config = options.config || (await getConfig());

    const ruleCollection = initRuleCollection();

    if (!config) {
      return {
        success: false,
        error: "Configuration file not found",
        installedRuleCount: 0,
        packagesCount: 0,
      };
    }

    // Check if rules are defined (either directly or through presets)
    if (!config.rules || Object.keys(config.rules).length === 0) {
      // If there are no presets defined either, show a message
      if (!config.presets || config.presets.length === 0) {
        return {
          success: false,
          error: "No rules defined in configuration",
          installedRuleCount: 0,
          packagesCount: 0,
        };
      }
    }

    const expandedRules = config.rules;

    let hasErrors = false;
    const errorMessages: string[] = [];
    let firstErrorStack: string | undefined;
    let installedRuleCount = 0;

    for (const [name, source] of Object.entries(expandedRules)) {
      try {
        const ruleContent = collectLocalRule(name, source);
        addRuleToCollection(ruleCollection, ruleContent, config.ides);
        installedRuleCount++;
      } catch (e) {
        hasErrors = true;
        const errorMessage = `Error processing rule ${name}: ${e instanceof Error ? e.message : String(e)}`;
        errorMessages.push(errorMessage);
        if (!firstErrorStack && e instanceof Error && e.stack) {
          firstErrorStack = e.stack;
        }
      }
    }

    if (hasErrors) {
      return {
        success: false,
        error: errorMessages.join("; "),
        errorStack: firstErrorStack,
        installedRuleCount,
        packagesCount: 0,
      };
    }

    writeRulesToTargets(ruleCollection);

    if (config.mcpServers) {
      const filteredMcpServers = Object.fromEntries(
        Object.entries(config.mcpServers).filter(([, v]) => v !== false),
      );
      writeMcpServersToTargets(filteredMcpServers, config.ides, cwd);
    }

    return {
      success: true,
      installedRuleCount,
      packagesCount: 1,
    };
  });
}
