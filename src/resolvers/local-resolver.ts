import fs from "fs-extra";
import path from "node:path";
import { getIdePaths } from "../utils/rule-status";

/**
 * Install a rule from a local file source
 */
export function installLocalRule(
  ruleName: string,
  source: string,
  ides: string[],
  basePath?: string
): boolean {
  console.log(`Installing rule from local file ${source}...`);

  try {
    // Resolve path relative to base path or current directory
    let sourcePath = source;
    if (!path.isAbsolute(source)) {
      if (basePath) {
        // If a base path is provided (e.g., for presets), resolve relative to that
        sourcePath = path.resolve(path.dirname(basePath), source);
      } else {
        // Otherwise resolve relative to current directory
        sourcePath = path.resolve(process.cwd(), source);
      }
    }

    // Check if file exists
    if (!fs.existsSync(sourcePath)) {
      console.log(`Error: Source file ${sourcePath} not found.`);
      return false;
    }

    // Read the file
    const ruleContent = fs.readFileSync(sourcePath, "utf8");

    // Install to each configured IDE
    const idePaths = getIdePaths();

    for (const ide of ides) {
      if (!idePaths[ide]) {
        console.log(`Warning: Unknown IDE '${ide}'. Skipping.`);
        continue;
      }

      if (ide === "cursor") {
        // For Cursor, create a file per rule (could also symlink but copying is safer)
        const ruleDir = idePaths[ide];
        fs.ensureDirSync(ruleDir);

        const ruleFile = path.join(ruleDir, `${ruleName}.mdc`);
        fs.copyFileSync(sourcePath, ruleFile);
        console.log(`Copied to Cursor: ${ruleFile}`);
      }
    }

    console.log("Rule installed successfully!");
    return true;
  } catch (error) {
    console.log("Error installing rule from local file:", error);
    return false;
  }
}
