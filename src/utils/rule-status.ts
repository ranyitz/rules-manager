import fs from "fs-extra";
import path from "node:path";

/**
 * Get the IDE-specific rule installation paths
 */
export function getIdePaths(): Record<string, string> {
  const projectDir = process.cwd(); // Get current working directory (project root)

  return {
    cursor: path.join(projectDir, ".cursor", "rules"),
    windsurf: path.join(projectDir, ".rules"),
  };
}

/**
 * Check if a rule is installed in the specified IDEs
 */
export function checkRuleStatus(
  ruleName: string,
  ruleType: string,
  ides: string[],
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

    if (ide === "windsurf") {
      // For Windsurf, check if the rule exists in .rules directory
      // and if it's referenced in .windsurfrules
      const ruleExists = fs.existsSync(
        path.join(idePaths[ide], `${ruleName}.md`),
      );

      // Check if .windsurfrules exists and contains a reference to this rule
      const windsurfRulesPath = path.join(process.cwd(), ".windsurfrules");
      if (fs.existsSync(windsurfRulesPath)) {
        const windsurfRulesContent = fs.readFileSync(windsurfRulesPath, "utf8");
        return (
          ruleExists && windsurfRulesContent.includes(`.rules/${ruleName}.md`)
        );
      }

      return false;
    }

    return false;
  });
}
