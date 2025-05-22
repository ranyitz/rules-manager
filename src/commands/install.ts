import chalk from "chalk";
import {
  getConfig,
  getRuleSource,
  getOriginalPresetPath,
} from "../utils/config";
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
import { isCI } from "ci-info";
import { discoverPackagesWithAicm } from "./monorepo/discovery";
import { installMonorepoPackages } from "./monorepo/monorepo-install";

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
   * allow installation on CI environments
   */
  installOnCI?: boolean;
  /**
   * Enable monorepo mode
   */
  monorepo?: boolean;
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

async function handleMonorepoInstallation(
  cwd: string,
  installOnCI: boolean,
  originalCwd: string,
  verbose: boolean = false,
): Promise<InstallResult> {
  if (verbose) {
    console.log(chalk.blue("🔍 Discovering packages..."));
  }

  const packages = await discoverPackagesWithAicm(cwd);

  if (packages.length === 0) {
    if (cwd !== originalCwd) {
      process.chdir(originalCwd);
    }

    return {
      success: false,
      error: "No packages with aicm configurations found in monorepo.",
      installedRuleCount: 0,
      packagesCount: 0,
    };
  }

  if (verbose) {
    console.log(
      chalk.blue(`Found ${packages.length} packages with aicm configurations:`),
    );
    packages.forEach((pkg) => {
      console.log(chalk.gray(`  - ${pkg.relativePath}`));
    });

    console.log(chalk.blue(`📦 Installing configurations...`));
  }
  const result = await installMonorepoPackages(packages, {
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

    if (cwd !== originalCwd) {
      process.chdir(originalCwd);
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

  if (cwd !== originalCwd) {
    process.chdir(originalCwd);
  }

  return {
    success: true,
    installedRuleCount: result.totalRuleCount,
    packagesCount: result.packages.length,
  };
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

  try {
    const originalCwd = process.cwd();
    if (cwd !== originalCwd) {
      process.chdir(cwd);
    }

    // Handle monorepo mode first, before checking for config
    if (options.monorepo) {
      return await handleMonorepoInstallation(
        cwd,
        installOnCI,
        originalCwd,
        options.verbose,
      );
    }

    const config = options.config || getConfig();

    // Handle monorepo mode from config
    if (config?.monorepo) {
      return await handleMonorepoInstallation(
        cwd,
        installOnCI,
        originalCwd,
        options.verbose,
      );
    }

    const ruleCollection = initRuleCollection();

    if (!config) {
      if (cwd !== originalCwd) {
        process.chdir(originalCwd);
      }

      return {
        success: false,
        error: "Configuration file not found!",
        installedRuleCount: 0,
        packagesCount: 0,
      };
    }

    const inCI = isInCIEnvironment();

    if (inCI && !installOnCI && !config.installOnCI) {
      if (cwd !== originalCwd) {
        process.chdir(originalCwd);
      }

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
        if (cwd !== originalCwd) {
          process.chdir(originalCwd);
        }

        return {
          success: false,
          error: "No rules defined in configuration.",
          installedRuleCount: 0,
          packagesCount: 0,
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
      // Get the original preset path for namespacing
      const originalPresetPath = getOriginalPresetPath(config, name);

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
            errorMessages.push(`Unknown rule type: ${ruleType}`);
            continue;
        }

        // Add the preset path to the rule content for namespacing
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

    // If there were errors, exit with error
    if (hasErrors) {
      if (cwd !== originalCwd) {
        process.chdir(originalCwd);
      }

      return {
        success: false,
        error: errorMessages.join("; "),
        installedRuleCount,
        packagesCount: 0,
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

    // Restore original cwd
    if (cwd !== originalCwd) {
      process.chdir(originalCwd);
    }

    return {
      success: true,
      installedRuleCount,
      packagesCount: 1,
    };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);

    // If cwd was changed, restore it
    if (cwd !== process.cwd()) {
      process.chdir(cwd);
    }

    return {
      success: false,
      error: errorMessage,
      installedRuleCount: 0,
      packagesCount: 0,
    };
  }
}

export async function installCommand(
  installOnCI?: boolean,
  monorepo?: boolean,
  verbose?: boolean,
): Promise<void> {
  try {
    const result = await install({ installOnCI, monorepo, verbose });

    if (!result.success) {
      console.error(chalk.red(result.error));
      process.exit(1);
    } else {
      if (result.packagesCount > 1) {
        console.log(
          `Successfully installed ${result.installedRuleCount} rules across ${result.packagesCount} packages`,
        );
      } else if (monorepo) {
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
