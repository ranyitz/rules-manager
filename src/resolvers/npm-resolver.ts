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
  ides: string[]
): boolean {
  console.log(`Installing rule from npm package ${source}...`);

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

    try {
      // First try from local node_modules
      const packageRoot = path.resolve(
        process.cwd(),
        "node_modules",
        packageName
      );
      ruleFile = packagePath
        ? path.join(packageRoot, packagePath)
        : packageRoot;

      if (!fs.existsSync(ruleFile)) {
        throw new Error(
          `Package not found in local node_modules: ${packageName}`
        );
      }

      ruleContent = fs.readFileSync(ruleFile, "utf8");
    } catch (error) {
      console.log(
        `Warning: Could not resolve package from local node_modules: ${error}`
      );
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
        console.log(`Linked to Cursor: ${targetFile} -> ${ruleFile}`);
      }
    }

    console.log("Rule installed successfully!");
    return true;
  } catch (error) {
    console.log("Error installing rule from npm package:", error);
    return false;
  }
}
