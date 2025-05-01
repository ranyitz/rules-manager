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
  ruleBasePath?: string,
): boolean {
  try {
    // Resolve path relative to base path or current directory
    let sourcePath = source;
    if (!path.isAbsolute(source)) {
      if (ruleBasePath) {
        // If a base path is provided (e.g., for presets), resolve relative to that
        sourcePath = path.resolve(path.dirname(ruleBasePath), source);
      } else {
        // Otherwise resolve relative to current directory
        sourcePath = path.resolve(process.cwd(), source);
      }
    }

    // Check if file exists
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source file ${sourcePath} not found.`);
    }

    // Read the file
    const ruleContent = fs.readFileSync(sourcePath, "utf8");

    // Install to each configured IDE
    const idePaths = getIdePaths();

    for (const ide of ides) {
      if (!idePaths[ide]) {
        throw new Error(`Unknown IDE '${ide}'.`);
      }

      if (ide === "cursor") {
        // For Cursor, create a file per rule (could also symlink but copying is safer)
        const ruleDir = idePaths[ide];
        fs.ensureDirSync(ruleDir);

        const ruleFile = path.join(ruleDir, `${ruleName}.mdc`);
        fs.copyFileSync(sourcePath, ruleFile);
      }
    }

    return true;
  } catch (error) {
    // Re-throw the error instead of logging it
    throw error;
  }
}
