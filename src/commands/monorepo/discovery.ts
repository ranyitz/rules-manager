import path from "node:path";
import { PackageInfo } from "../../types";
import { getConfig } from "../../utils/config";

/**
 * Discover all packages with aicm configurations in a monorepo
 * @param rootDir The root directory to search from
 * @returns Array of discovered packages
 */
export async function discoverPackagesWithAicm(
  rootDir: string,
): Promise<PackageInfo[]> {
  const { globby } = await import("globby");

  const aicmFiles = await globby("**/aicm.json", {
    cwd: rootDir,
    absolute: true,
    gitignore: true,
  });

  const packages: PackageInfo[] = [];

  for (const aicmFile of aicmFiles) {
    const packageDir = path.dirname(aicmFile);
    const relativePath = path.relative(rootDir, packageDir);

    const config = getConfig(packageDir);

    if (config) {
      packages.push({
        relativePath: relativePath || ".",
        absolutePath: packageDir,
        config,
      });
    }
  }

  return packages;
}
