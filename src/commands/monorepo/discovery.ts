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
  const output = execSync("git ls-files --cached --others --exclude-standard", {
    cwd: rootDir,
    encoding: "utf8",
  });

  return output
    .trim()
    .split("\n")
    .filter(Boolean)
    .filter((file) => file.endsWith("aicm.json"))
    .map((file) => path.resolve(rootDir, file));
}

/**
 * Discover all packages with aicm configurations in a monorepo
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
