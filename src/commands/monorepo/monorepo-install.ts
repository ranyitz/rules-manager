import { PackageInfo, MonorepoInstallResult } from "../../types";
import { install, InstallOptions } from "../install";

/**
 * Install aicm configurations for all packages in a monorepo
 * @param packages The packages to install configurations for
 * @param options Install options
 * @returns Result of the monorepo installation
 */
export async function installMonorepoPackages(
  packages: PackageInfo[],
  options: InstallOptions = {},
): Promise<MonorepoInstallResult> {
  const results: MonorepoInstallResult["packages"] = [];
  let totalRuleCount = 0;

  // Install packages sequentially for now (can be parallelized later)
  for (const pkg of packages) {
    const packagePath = pkg.absolutePath;

    try {
      const result = await install({
        ...options,
        cwd: packagePath,
      });

      totalRuleCount += result.installedRuleCount;

      results.push({
        path: pkg.relativePath,
        success: result.success,
        error: result.error,
        installedRuleCount: result.installedRuleCount,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      results.push({
        path: pkg.relativePath,
        success: false,
        error: errorMessage,
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
