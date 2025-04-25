import fs from "fs-extra";
import path from "node:path";
import axios from "axios";
import { getIdePaths } from "../utils/rule-status";
import chalk from "chalk";

/**
 * Install a rule from a URL source
 */
export async function installUrlRule(
  ruleName: string,
  source: string,
  ides: string[]
): Promise<void> {
  console.log(`Downloading rule from ${source}...`);
  // Download the rule content
  let ruleContent;

  try {
    const response = await axios.get(source);
    ruleContent = response.data;
  } catch (error) {
    throw new Error(`Error downloading rule from ${source}: ${error}`);
  }

  if (!ruleContent) {
    throw new Error("Error: Empty rule content");
  }

  // Install for each configured IDE
  const idePaths = getIdePaths();

  for (const ide of ides) {
    if (!idePaths[ide]) {
      console.log(`Warning: Unknown IDE '${ide}'. Skipping.`);
      continue;
    }

    if (ide === "cursor") {
      // For Cursor, create a file per rule
      const ruleDir = idePaths[ide];
      fs.ensureDirSync(ruleDir);

      const ruleFile = path.join(ruleDir, `${ruleName}.mdc`);
      fs.writeFileSync(ruleFile, ruleContent);
      console.log(`Installed to Cursor: ${ruleFile}`);
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
}
