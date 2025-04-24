import fs from "fs-extra";
import path from "node:path";
import { execSync } from "node:child_process";
import { getIdePaths } from "../utils/rule-status";

/**
 * Find the location of an npm package in node_modules
 */
function findNpmPackage(packageName: string): string | null {
  try {
    // Try to get package location
    const modulePath = path.join(process.cwd(), "node_modules", packageName);

    if (fs.existsSync(modulePath)) {
      return modulePath;
    }

    // If not found directly, try npm ls command to find it
    const npmOutput = execSync(`npm ls ${packageName} --json`, {
      encoding: "utf-8",
    });
    const packageInfo = JSON.parse(npmOutput);

    if (
      packageInfo &&
      packageInfo.dependencies &&
      packageInfo.dependencies[packageName]
    ) {
      return path.join(process.cwd(), "node_modules", packageName);
    }

    return null;
  } catch (error) {
    console.log("Error finding npm package:", error);
    return null;
  }
}

/**
 * Install a rule from an npm package
 */
export function installNpmRule(
  ruleName: string,
  source: string,
  ides: string[]
): boolean {
  console.log(`Installing rule from npm package ${source}...`);

  try {
    // Find the package
    const packagePath = findNpmPackage(source);

    if (!packagePath) {
      console.log(`Error: Package ${source} not found in node_modules.`);
      console.log("Make sure the package is installed as a dependency.");
      return false;
    }

    // Look for rule files in the package
    const ruleFile = path.join(packagePath, `${ruleName}.mdc`);

    if (!fs.existsSync(ruleFile)) {
      console.log(`Error: Rule file ${ruleName}.mdc not found in package.`);
      return false;
    }

    // Get rule content
    const ruleContent = fs.readFileSync(ruleFile, "utf8");

    // Install for each configured IDE
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
    console.log("Error installing rule from npm package:", error);
    return false;
  }
}
