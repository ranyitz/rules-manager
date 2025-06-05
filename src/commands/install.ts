import chalk from "chalk";
import {
  getConfig,
  getRuleSource,
  getOriginalPresetPath,
} from "../utils/config";
import { detectRuleType } from "../utils/rule-detector";
import { NormalizedConfig } from "../types";
import {
  collectLocalRule,
  collectNpmRule,
  initRuleCollection,
  addRuleToCollection,
} from "../utils/rule-collector";
import { writeRulesToTargets } from "../utils/rule-writer";
import { isCI } from "ci-info";
import { discoverPackagesWithAicm } from "./workspaces/discovery";
import { installWorkspacesPackages } from "./workspaces/workspaces-install";
import { writeMcpServersToTargets } from "../utils/mcp-writer";
import { expandRulesGlobPatterns } from "../utils/glob-handler";

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
  config?: NormalizedConfig;
  /**
   * allow installation on CI environments
   */
  installOnCI?: boolean;
  /**
   * Enable workspaces mode
   */
  workspaces?: boolean;
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
   * Number of rules installed
   */
  installedRuleCount: number;
  /**
   * Number of packages installed
   */
  packagesCount: number;
}

/**
 * Helper function to execute a function within a specific working directory
 * and ensure the original directory is always restored
 */
async function withWorkingDirectory<T>(
  targetDir: string,
  fn: () => Promise<T>,
): Promise<T> {
  const originalCwd = process.cwd();
  if (targetDir !== originalCwd) {
    process.chdir(targetDir);
  }

  try {
    return await fn();
  } finally {
    if (targetDir !== originalCwd) {
      process.chdir(originalCwd);
    }
  }
}

/**
 * Checks if the current environment is a CI environment
 * This function respects any explicit settings in process.env.CI
 */
function isInCIEnvironment(): boolean {
  // Explicit environment variable settings take precedence
  if (process.env.CI === "true") return true;
  if (process.env.CI === "false") return false;

  // Fall back to ci-info's detection
  return isCI;
}

async function handleWorkspacesInstallation(
  cwd: string,
  installOnCI: boolean,
  verbose: boolean = false,
): Promise<InstallResult> {
  return withWorkingDirectory(cwd, async () => {
    if (verbose) {
      console.log(chalk.blue("🔍 Discovering packages..."));
    }

    const packages = await discoverPackagesWithAicm(cwd);

    if (packages.length === 0) {
      return {
        success: false,
        error: "No packages with aicm configurations found",
        installedRuleCount: 0,
        packagesCount: 0,
      };
    }

    if (verbose) {
      console.log(
        chalk.blue(
          `Found ${packages.length} packages with aicm configurations:`,
        ),
      );
      packages.forEach((pkg) => {
        console.log(chalk.gray(`  - ${pkg.relativePath}`));
      });

      console.log(chalk.blue(`📦 Installing configurations...`));
    }
    const result = await installWorkspacesPackages(packages, {
      installOnCI,
    });

    if (verbose) {
      result.packages.forEach((pkg) => {
        if (pkg.success) {
          console.log(
            chalk.green(`✅ ${pkg.path} (${pkg.installedRuleCount} rules)`),
          );
        } else {
          console.log(chalk.red(`❌ ${pkg.path}: ${pkg.error}`));
        }
      });
    }

    const failedPackages = result.packages.filter((r) => !r.success);

    if (failedPackages.length > 0) {
      console.log(chalk.yellow(`Installation completed with errors`));
      if (verbose) {
        console.log(
          chalk.green(
            `Successfully installed: ${result.packages.length - failedPackages.length}/${result.packages.length} packages (${result.totalRuleCount} rules total)`,
          ),
        );
        console.log(
          chalk.red(
            `Failed packages: ${failedPackages.map((p) => p.path).join(", ")}`,
          ),
        );
      }

      const errorDetails = failedPackages
        .map((p) => `${p.path}: ${p.error}`)
        .join("; ");

      return {
        success: false,
        error: `Package installation failed for ${failedPackages.length} package(s): ${errorDetails}`,
        installedRuleCount: result.totalRuleCount,
        packagesCount: result.packages.length,
      };
    }

    return {
      success: true,
      installedRuleCount: result.totalRuleCount,
      packagesCount: result.packages.length,
    };
  });
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
  const installOnCI = options.installOnCI === true; // Default to false if not specified

  return withWorkingDirectory(cwd, async () => {
    if (options.workspaces) {
      return await handleWorkspacesInstallation(
        cwd,
        installOnCI,
        options.verbose,
      );
    }

    const config = options.config || getConfig();

    const ruleCollection = initRuleCollection();

    if (!config) {
      return {
        success: false,
        error: "Configuration file not found",
        installedRuleCount: 0,
        packagesCount: 0,
      };
    }

    const inCI = isInCIEnvironment();

    if (inCI && !installOnCI && !config.installOnCI) {
      console.log(chalk.yellow("Detected CI environment, skipping install."));

      return {
        success: true,
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

    let expandedRules: Record<string, string>;

    try {
      const expansion = await expandRulesGlobPatterns(config.rules, cwd);
      expandedRules = expansion.expandedRules;

      if (options.verbose) {
        for (const [expandedKey, originalPattern] of Object.entries(
          expansion.globSources,
        )) {
          console.log(
            chalk.gray(`  Pattern "${originalPattern}" → ${expandedKey}`),
          );
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Error expanding glob patterns: ${error instanceof Error ? error.message : String(error)}`,
        installedRuleCount: 0,
        packagesCount: 0,
      };
    }

    let hasErrors = false;
    const errorMessages: string[] = [];
    let installedRuleCount = 0;

    for (const [name, source] of Object.entries(expandedRules)) {
      const ruleType = detectRuleType(source);
      const ruleBasePath = getRuleSource(config, name);
      const originalPresetPath = getOriginalPresetPath(config, name);

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
            errorMessages.push(`Unknown rule type: ${ruleType}`);
            continue;
        }

        if (originalPresetPath) {
          ruleContent.presetPath = originalPresetPath;
        }

        addRuleToCollection(ruleCollection, ruleContent, config.ides);
        installedRuleCount++;
      } catch (e) {
        hasErrors = true;
        const errorMessage = `Error processing rule ${name}: ${e instanceof Error ? e.message : String(e)}`;
        errorMessages.push(errorMessage);
      }
    }

    if (hasErrors) {
      return {
        success: false,
        error: errorMessages.join("; "),
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

export async function installCommand(
  installOnCI?: boolean,
  workspaces?: boolean,
  verbose?: boolean,
): Promise<void> {
  try {
    const result = await install({ installOnCI, workspaces, verbose });

    if (!result.success) {
      console.error(chalk.red(result.error));
      process.exit(1);
    } else {
      if (result.packagesCount > 1) {
        console.log(
          `Successfully installed ${result.installedRuleCount} rules across ${result.packagesCount} packages`,
        );
      } else if (workspaces) {
        console.log(
          `Successfully installed ${result.installedRuleCount} rules across ${result.packagesCount} packages`,
        );
      } else {
        console.log("Rules installation completed");
      }
    }
  } catch (error: unknown) {
    console.error(
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }
}
