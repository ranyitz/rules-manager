import { PackageInfo, WorkspacesInstallResult } from "../../types";
import { installPackage, InstallOptions } from "../install";

/**
 * Install aicm configurations for all packages in a workspace
 * @param packages The packages to install configurations for
 * @param options Install options
 * @returns Result of the workspace installation
 */
export async function installWorkspacesPackages(
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
