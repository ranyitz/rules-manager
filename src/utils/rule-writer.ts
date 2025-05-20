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
    writeWindsurfRulesFromCollection(collection.windsurf, idePaths.windsurf);
  }
}

/**
 * Extract a normalized namespace from a preset path
 * @param presetPath The original preset path
 * @returns An array of path segments to use for namespacing
 */
function extractNamespaceFromPresetPath(presetPath: string): string[] {
  // Special case: npm package names always use forward slashes, regardless of platform
  if (presetPath.startsWith("@")) {
    // For scoped packages like @scope/package/subdir, create nested directories
    return presetPath.split("/");
  }

  // Handle both Unix and Windows style path separators
  const parts = presetPath.split(/[/\\]/);
  return parts.filter((part) => part.length > 0); // Filter out empty segments
}

/**
 * Write rules to Cursor's rules directory
 * @param rules The rules to write
 * @param cursorRulesDir The path to Cursor's rules directory
 */
function writeCursorRules(rules: RuleContent[], cursorRulesDir: string): void {
  fs.emptyDirSync(cursorRulesDir);

  for (const rule of rules) {
    let rulePath;

    // Parse rule name into path segments using platform-specific path separator
    const ruleNameParts = rule.name.split(/[/\\]/).filter(Boolean);

    if (rule.presetPath) {
      // For rules from presets, create a namespaced directory structure
      const namespace = extractNamespaceFromPresetPath(rule.presetPath);
      // Path will be: cursorRulesDir/namespace/rule-name.mdc
      rulePath = path.join(cursorRulesDir, ...namespace, ...ruleNameParts);
    } else {
      // For local rules, maintain the original flat structure
      rulePath = path.join(cursorRulesDir, ...ruleNameParts);
    }

    const ruleFile = rulePath + ".mdc";
    fs.ensureDirSync(path.dirname(ruleFile));

    if (fs.existsSync(rule.sourcePath)) {
      fs.copyFileSync(rule.sourcePath, ruleFile);
    } else {
      const mdcContent = `---\n${JSON.stringify(rule.metadata, null, 2)}\n---\n\n${rule.content}`;
      fs.writeFileSync(ruleFile, mdcContent);
    }
  }
}

/**
 * Write rules to Windsurf's rules directory and update .windsurfrules file
 * @param rules The rules to write
 */
function writeWindsurfRulesFromCollection(
  rules: RuleContent[],
  ruleDir: string,
): void {
  fs.emptyDirSync(ruleDir);

  const ruleFiles = rules.map((rule) => {
    let rulePath;

    // Parse rule name into path segments using platform-specific path separator
    const ruleNameParts = rule.name.split(/[/\\]/).filter(Boolean);

    if (rule.presetPath) {
      // For rules from presets, create a namespaced directory structure
      const namespace = extractNamespaceFromPresetPath(rule.presetPath);
      // Path will be: ruleDir/namespace/rule-name.md
      rulePath = path.join(ruleDir, ...namespace, ...ruleNameParts);
    } else {
      // For local rules, maintain the original flat structure
      rulePath = path.join(ruleDir, ...ruleNameParts);
    }

    const physicalRulePath = rulePath + ".md";
    fs.ensureDirSync(path.dirname(physicalRulePath));
    fs.writeFileSync(physicalRulePath, rule.content);

    const relativeRuleDir = path.basename(ruleDir); // Gets '.rules'

    // For the Windsurf rules file, we need to maintain the same structure
    let windsurfPath;
    if (rule.presetPath) {
      const namespace = extractNamespaceFromPresetPath(rule.presetPath);
      windsurfPath =
        path.join(relativeRuleDir, ...namespace, ...ruleNameParts) + ".md";
    } else {
      windsurfPath = path.join(relativeRuleDir, ...ruleNameParts) + ".md";
    }

    // Normalize to POSIX style for cross-platform compatibility in .windsurfrules
    const windsurfPathPosix = windsurfPath.replace(/\\/g, "/");

    return {
      name: rule.name,
      path: windsurfPathPosix,
      metadata: rule.metadata,
    };
  });

  const windsurfRulesContent = generateWindsurfRulesContent(ruleFiles);
  writeWindsurfRules(windsurfRulesContent);
}
