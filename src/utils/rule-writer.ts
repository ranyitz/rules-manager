import fs from "fs-extra";
import path from "node:path";
import { getIdePaths } from "./rule-status";
import { RuleCollection, RuleContent } from "../types";
import {
  writeWindsurfRules,
  generateWindsurfRulesContent,
} from "./windsurf-writer";

/**
 * Write all collected rules to their respective IDE targets
 * @param collection The collection of rules to write
 */
export function writeRulesToTargets(collection: RuleCollection): void {
  const idePaths = getIdePaths();

  // Write Cursor rules
  if (collection.cursor.length > 0) {
    writeCursorRules(collection.cursor, idePaths.cursor);
  }

  // Write Windsurf rules
  if (collection.windsurf.length > 0) {
    writeWindsurfRulesFromCollection(collection.windsurf);
  }
}

/**
 * Write rules to Cursor's rules directory
 * @param rules The rules to write
 * @param cursorRulesDir The path to Cursor's rules directory
 */
function writeCursorRules(rules: RuleContent[], cursorRulesDir: string): void {
  fs.ensureDirSync(cursorRulesDir);

  for (const rule of rules) {
    const ruleFile =
      path.join(cursorRulesDir, ...rule.name.split("/")) + ".mdc";
    fs.ensureDirSync(path.dirname(ruleFile));

    // For Cursor, we either copy the file or create a symlink to the original
    if (fs.existsSync(rule.sourcePath)) {
      // Copy the file (safer than symlink)
      fs.copyFileSync(rule.sourcePath, ruleFile);
    } else {
      // If source path doesn't exist (shouldn't happen), write content directly
      const mdcContent = `---\n${JSON.stringify(rule.metadata, null, 2)}\n---\n\n${rule.content}`;
      fs.writeFileSync(ruleFile, mdcContent);
    }
  }
}

/**
 * Write rules to Windsurf's rules directory and update .windsurfrules file
 * @param rules The rules to write
 */
function writeWindsurfRulesFromCollection(rules: RuleContent[]): void {
  const idePaths = getIdePaths();
  const ruleDir = idePaths.windsurf;
  fs.ensureDirSync(ruleDir);

  // First write individual rule files
  const ruleFiles = rules.map((rule) => {
    const ruleFile = path.join(ruleDir, ...rule.name.split("/")) + ".md";
    fs.ensureDirSync(path.dirname(ruleFile));
    fs.writeFileSync(ruleFile, rule.content);

    return {
      name: rule.name,
      path: `.rules/${rule.name}.md`,
      metadata: rule.metadata,
    };
  });

  // Then generate and write the .windsurfrules file
  const windsurfRulesContent = generateWindsurfRulesContent(ruleFiles);
  writeWindsurfRules(windsurfRulesContent);
}
