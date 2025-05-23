import path from "node:path";
import { execSync } from "node:child_process";
import { PackageInfo } from "../../types";
import { getConfig } from "../../utils/config";

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
 * Discover all packages with aicm configurations in a workspace
 * @param rootDir The root directory to search from
 * @returns Array of discovered packages
 */
export async function discoverPackagesWithAicm(
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
