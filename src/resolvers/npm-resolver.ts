import fs from "fs-extra";
import path from "node:path";
import { getIdePaths } from "../utils/rule-status";

/**
 * Install a rule from an npm package
 *
 * This function handles:
 * 1. Direct package names: "@company/rules"
 * 2. Package with path: "@company/rules/path/to/rule.mdc"
 */
export function installNpmRule(
  ruleName: string,
  source: string,
  ides: string[],
): boolean {
  try {
    // Parse source into package and file path
    let packageName: string;
    let packagePath: string;

    if (source.includes("/") && !source.startsWith("@")) {
      // Format: "package-name/path/to/file.mdc"
      const firstSlash = source.indexOf("/");
      packageName = source.substring(0, firstSlash);
      packagePath = source.substring(firstSlash + 1);
    } else if (source.startsWith("@")) {
      // Format: "@scope/package/path/to/file.mdc"
      const parts = source.split("/");
      // @scope/package
      packageName = `${parts[0]}/${parts[1]}`;
      // Remaining path, if any
      packagePath = parts.slice(2).join("/");
    } else {
      // Format: "package-name" (whole package)
      packageName = source;
      packagePath = "";
    }

    // Try to resolve the package
    let ruleFile: string;
    let ruleContent: string;
    let packageRoot: string;

    try {
      // Try to find the package and get its root directory
      packageRoot = findPackageRoot(packageName);

      // Resolve the full path to the rule file
      ruleFile = packagePath
        ? path.join(packageRoot, packagePath)
        : packageRoot;

      if (!fs.existsSync(ruleFile)) {
        throw new Error(`Rule file not found in package: ${ruleFile}`);
      }

      ruleContent = fs.readFileSync(ruleFile, "utf8");
    } catch (error) {
      throw error;
    }

    // Install for configured IDE
    const idePaths = getIdePaths();

    for (const ide of ides) {
      if (!idePaths[ide]) {
        console.log(`Warning: Unknown IDE '${ide}'. Skipping.`);
        continue;
      }

      if (ide === "cursor") {
        // For Cursor, create a symbolic link
        const ruleDir = idePaths[ide];
        fs.ensureDirSync(ruleDir);

        const targetFile = path.join(ruleDir, `${ruleName}.mdc`);

        // Remove existing file/link if it exists
        if (fs.existsSync(targetFile)) {
          fs.removeSync(targetFile);
        }

        // Create symbolic link
        fs.symlinkSync(ruleFile, targetFile);
        console.log(`Linked to Cursor: ${targetFile}`);
      }
    }

    console.log("Rule installed successfully!");
    return true;
  } catch (error) {
    console.log("Error installing rule from npm package:", error);
    return false;
  }
}

/**
 * Find the root directory of a package by name
 * @param packageName The name of the package
 * @returns The absolute path to the package's root directory
 */
function findPackageRoot(packageName: string): string {
  try {
    // Method 1: Try to use require.resolve
    const packageEntry = require.resolve(packageName, {
      paths: [process.cwd()],
    });

    // Navigate up until we find a package.json or reach a reasonable limit
    let currentDir = path.dirname(packageEntry);
    let iterations = 0;
    const maxIterations = 3; // Prevent infinite loops

    while (iterations < maxIterations) {
      // If we found the package.json, this is likely the package root
      if (fs.existsSync(path.join(currentDir, "package.json"))) {
        return currentDir;
      }

      // Move up one directory
      const parentDir = path.dirname(currentDir);

      // If we've reached the root or haven't changed directory, stop
      if (parentDir === currentDir) {
        break;
      }

      currentDir = parentDir;
      iterations++;
    }

    // If we couldn't find package.json, use the directory of the entry point
    return path.dirname(packageEntry);
  } catch (error) {
    // Method 2: Fall back to direct node_modules resolution
    const nodeModulesPath = path.resolve(
      process.cwd(),
      "node_modules",
      packageName,
    );

    if (!fs.existsSync(nodeModulesPath)) {
      throw new Error(`Package '${packageName}' not found in node_modules.`);
    }

    return nodeModulesPath;
  }
}
