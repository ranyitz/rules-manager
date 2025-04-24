import fs from "fs-extra";
import path from "node:path";
import { getIdePaths } from "../utils/rule-status";

/**
 * Install a rule from a local file
 */
export function installLocalRule(
  ruleName: string,
  source: string,
  ides: string[]
): boolean {
  console.log(`Installing rule from local file ${source}...`);

  try {
    // Resolve source path (could be relative or absolute)
    const sourcePath = path.isAbsolute(source)
      ? source
      : path.resolve(process.cwd(), source);

    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
      console.log(`Error: Source file ${sourcePath} not found.`);
      return false;
    }

    // Read rule content
    const ruleContent = fs.readFileSync(sourcePath, "utf8");

    // Install for each configured IDE
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
      } else if (ide === "windsurf") {
        // For Windsurf, append to the rules file in project directory
        const rulesDir = idePaths[ide];
        fs.ensureDirSync(rulesDir);

        const rulesFile = path.join(rulesDir, ".windsurfrules");

        // Create file with header if it doesn't exist
        if (!fs.existsSync(rulesFile)) {
          fs.writeFileSync(rulesFile, "# Windsurf Rules\n\n");
        }

        // Add rule with a separator
        const ruleSection = `\n\n--- ${ruleName} ---\n${ruleContent}\n--- End ${ruleName} ---\n`;
        fs.appendFileSync(rulesFile, ruleSection);
        console.log(`Added to Windsurf rules: ${rulesFile}`);
      }
    }

    console.log("Rule installed successfully!");
    return true;
  } catch (error) {
    console.log("Error installing rule from local file:", error);
    return false;
  }
}
