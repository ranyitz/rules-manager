import fs from "fs-extra";
import path from "node:path";
import os from "node:os";

/**
 * Get the IDE-specific rule installation paths
 */
export function getIdePaths(): Record<string, string> {
  const homeDir = os.homedir();

  return {
    cursor: path.join(homeDir, ".cursor", "rules"),
    windsurf: path.join(homeDir, ".config", "windsurf"),
  };
}

/**
 * Check if a rule is installed in the specified IDEs
 */
export function checkRuleStatus(
  ruleName: string,
  ruleType: string,
  ides: string[]
): boolean {
  const idePaths = getIdePaths();

  // Check if rule is installed in all specified IDEs
  return ides.every((ide) => {
    if (!idePaths[ide]) {
      return false;
    }

    if (ide === "cursor") {
      return fs.existsSync(path.join(idePaths[ide], `${ruleName}.mdc`));
    } else if (ide === "windsurf") {
      const rulesFile = path.join(idePaths[ide], ".windsurfrules");

      if (!fs.existsSync(rulesFile)) {
        return false;
      }

      // Check if rule is mentioned in the file
      const content = fs.readFileSync(rulesFile, "utf8");
      return content.includes(`--- ${ruleName} ---`);
    }

    return false;
  });
}
