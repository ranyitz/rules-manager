import fs from "fs-extra";
import path from "node:path";
import os from "node:os";

/**
 * Get the IDE-specific rule installation paths
 */
export function getIdePaths(): Record<string, string> {
  const projectDir = process.cwd(); // Get current working directory (project root)

  return {
    cursor: path.join(projectDir, ".cursor", "rules"),
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
    }

    return false;
  });
}
