import chalk from "chalk";
import { getConfig } from "../utils/config";
import { isCI } from "ci-info";
import { withWorkingDirectory } from "../utils/working-directory";
import {
  InstallOptions,
  InstallResult,
  installPackage,
} from "./install/install-package";
import { installWorkspaces } from "./install/install-workspaces";

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

  const inCI = isInCIEnvironment();
  if (inCI && !installOnCI) {
    console.log(chalk.yellow("Detected CI environment, skipping install."));

    return {
      success: true,
      installedRuleCount: 0,
      packagesCount: 0,
    };
  }

  return withWorkingDirectory(cwd, async () => {
    const config = options.config || getConfig();

    if (config?.workspaces) {
      return await installWorkspaces(cwd, installOnCI, options.verbose);
    }

    return installPackage(options);
  });
}

export async function installCommand(
  installOnCI?: boolean,
  verbose?: boolean,
): Promise<void> {
  const result = await install({ installOnCI, verbose });

  if (!result.success) {
    const error = new Error(result.error);
    if (result.errorStack) {
      error.stack = result.errorStack;
    }
    throw error;
  } else {
    if (result.packagesCount > 1) {
      console.log(
        `Successfully installed ${result.installedRuleCount} rules across ${result.packagesCount} packages`,
      );
    } else {
      console.log("Rules installation completed");
    }
  }
}
