import path from "node:path";
import { execSync } from "node:child_process";
import chalk from "chalk";
import { PackageInfo, WorkspacesInstallResult } from "../../types";
import { getConfig } from "../../utils/config";
import { withWorkingDirectory } from "../../utils/working-directory";
import {
  installPackage,
  InstallOptions,
  InstallResult,
} from "./install-package";

/**
 * Discover aicm.json files using git ls-files
 * @param rootDir The root directory to search from
 * @returns Array of aicm.json file paths
 */
function findAicmFiles(rootDir: string): string[] {
  const output = execSync(
    "git ls-files --cached --others --exclude-standard aicm.json **/aicm.json",
    {
      cwd: rootDir,
      encoding: "utf8",
    },
  );

  return output
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((file) => path.resolve(rootDir, file));
}

/**
 * Discover all packages with aicm configurations
 * @param rootDir The root directory to search from
 * @returns Array of discovered packages
 */
async function discoverPackagesWithAicm(
  rootDir: string,
): Promise<PackageInfo[]> {
  const aicmFiles = findAicmFiles(rootDir);

  const packages: PackageInfo[] = [];

  for (const aicmFile of aicmFiles) {
    const packageDir = path.dirname(aicmFile);
    const relativePath = path.relative(rootDir, packageDir);

    // Normalize to forward slashes for cross-platform compatibility
    const normalizedRelativePath = relativePath.replace(/\\/g, "/");

    const config = getConfig(packageDir);

    if (config) {
      packages.push({
        relativePath: normalizedRelativePath || ".",
        absolutePath: packageDir,
        config,
      });
    }
  }

  // Sort packages by relativePath for deterministic order
  return packages.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

/**
 * Install aicm configurations for all packages in a workspace
 * @param packages The packages to install configurations for
 * @param options Install options
 * @returns Result of the workspace installation
 */
async function installWorkspacesPackages(
  packages: PackageInfo[],
  options: InstallOptions = {},
): Promise<WorkspacesInstallResult> {
  const results: WorkspacesInstallResult["packages"] = [];
  let totalRuleCount = 0;

  // Install packages sequentially for now (can be parallelized later)
  for (const pkg of packages) {
    const packagePath = pkg.absolutePath;

    try {
      const result = await installPackage({
        ...options,
        cwd: packagePath,
      });

      totalRuleCount += result.installedRuleCount;

      results.push({
        path: pkg.relativePath,
        success: result.success,
        error: result.error,
        errorStack: result.errorStack,
        installedRuleCount: result.installedRuleCount,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      results.push({
        path: pkg.relativePath,
        success: false,
        error: errorMessage,
        errorStack: error instanceof Error ? error.stack : undefined,
        installedRuleCount: 0,
      });
    }
  }

  const failedPackages = results.filter((r) => !r.success);

  return {
    success: failedPackages.length === 0,
    packages: results,
    totalRuleCount,
  };
}

/**
 * Install rules across multiple packages in a workspace
 * @param cwd The current working directory
 * @param installOnCI Whether to install on CI environments
 * @param verbose Whether to show verbose output
 * @returns Result of the install operation
 */
export async function installWorkspaces(
  cwd: string,
  installOnCI: boolean,
  verbose: boolean = false,
): Promise<InstallResult> {
  return withWorkingDirectory(cwd, async () => {
    if (verbose) {
      console.log(chalk.blue("🔍 Discovering packages..."));
    }

    const allPackages = await discoverPackagesWithAicm(cwd);

    const packages = allPackages.filter((pkg) => {
      const isRoot = pkg.relativePath === ".";
      if (!isRoot) return true;

      // For root directories, only keep if it has rules or presets
      const hasRules =
        pkg.config.rules && Object.keys(pkg.config.rules).length > 0;
      const hasPresets = pkg.config.presets && pkg.config.presets.length > 0;
      return hasRules || hasPresets;
    });

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

    console.log(
      `Successfully installed ${result.totalRuleCount} rules across ${result.packages.length} packages`,
    );

    return {
      success: true,
      installedRuleCount: result.totalRuleCount,
      packagesCount: result.packages.length,
    };
  });
}
