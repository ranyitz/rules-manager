import fs from "fs-extra";
import path from "node:path";

/**
 * Get the IDE-specific rule installation paths
 */
export function getIdePaths(): Record<string, string> {
  const projectDir = process.cwd(); // Get current working directory (project root)

  return {
    cursor: path.join(projectDir, ".cursor", "rules", "aicm"),
    windsurf: path.join(projectDir, ".aicm"),
  };
}

/**
 * Check if a rule is installed in the specified IDEs
 */
export function checkRuleStatus(ruleName: string, ides: string[]): boolean {
  const idePaths = getIdePaths();

  return ides.every((ide) => {
    if (!idePaths[ide]) {
      return false;
    }

    if (ide === "cursor") {
      return fs.existsSync(path.join(idePaths[ide], `${ruleName}.mdc`));
    }

    if (ide === "windsurf") {
      const ruleExists = fs.existsSync(
        path.join(idePaths[ide], `${ruleName}.md`),
      );

      const windsurfRulesPath = path.join(process.cwd(), ".windsurfrules");
      if (fs.existsSync(windsurfRulesPath)) {
        const windsurfRulesContent = fs.readFileSync(windsurfRulesPath, "utf8");
        return (
          ruleExists && windsurfRulesContent.includes(`.aicm/${ruleName}.md`)
        );
      }

      return false;
    }

    return false;
  });
}
