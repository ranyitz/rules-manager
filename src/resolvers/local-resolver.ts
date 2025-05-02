import fs from "fs-extra";
import path from "node:path";
import { getIdePaths } from "../utils/rule-status";
import { parseMdcFile } from "../utils/mdc-parser";
import {
  writeWindsurfRules,
  generateWindsurfRulesContent,
} from "../utils/windsurf-writer";

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

    // Keep track of Windsurf rules for later processing
    const windsurfRules: {
      name: string;
      path: string;
      metadata: Record<string, any>;
    }[] = [];

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

      if (ide === "windsurf") {
        // For Windsurf, parse the MDC file and create a Markdown file in .rules directory
        const ruleDir = idePaths[ide];
        fs.ensureDirSync(ruleDir);

        // Parse the MDC file to extract metadata and content
        const { metadata, content } = parseMdcFile(sourcePath);

        // Create the Markdown file
        const ruleFile = path.join(ruleDir, `${ruleName}.md`);
        fs.writeFileSync(ruleFile, content);

        // Add to Windsurf rules for later processing
        windsurfRules.push({
          name: ruleName,
          path: `.rules/${ruleName}.md`,
          metadata,
        });
      }
    }

    // If Windsurf is one of the IDEs, update the .windsurfrules file
    if (ides.includes("windsurf") && windsurfRules.length > 0) {
      updateWindsurfRulesFile(windsurfRules);
    }

    return true;
  } catch (error) {
    // Re-throw the error instead of logging it
    throw error;
  }
}

/**
 * Update the .windsurfrules file with the installed rules
 */
export function updateWindsurfRulesFile(
  newRules: { name: string; path: string; metadata: Record<string, any> }[],
): void {
  const windsurfRulesPath = path.join(process.cwd(), ".windsurfrules");

  // Get existing rules from .windsurfrules if it exists
  const existingRules: {
    name: string;
    path: string;
    metadata: Record<string, any>;
  }[] = [];

  if (fs.existsSync(windsurfRulesPath)) {
    const windsurfRulesContent = fs.readFileSync(windsurfRulesPath, "utf8");

    // Extract rule paths from existing content
    const rulePathRegex = /- \.rules\/([\w-]+)\.md/g;
    let match;

    while ((match = rulePathRegex.exec(windsurfRulesContent)) !== null) {
      const rulePath = match[0].substring(2).trim();
      const ruleName = match[1];

      // Create default metadata based on context
      const metadata: Record<string, any> = {};

      if (
        windsurfRulesContent.includes("always apply") &&
        windsurfRulesContent.indexOf("always apply") < match.index
      ) {
        metadata.alwaysApply = true;
      } else if (
        windsurfRulesContent.includes("opt-in") &&
        windsurfRulesContent.indexOf("opt-in") < match.index
      ) {
        metadata.alwaysApply = false;
      } else if (
        windsurfRulesContent.includes("file patterns") &&
        windsurfRulesContent.indexOf("file patterns") < match.index
      ) {
        metadata.globs = [];
      }

      // Add to existing rules if not already being updated
      const isBeingUpdated = newRules.some((rule) => rule.path === rulePath);

      if (!isBeingUpdated) {
        existingRules.push({
          name: ruleName,
          path: rulePath,
          metadata,
        });
      }
    }
  }

  // Combine existing and new rules
  const allRules = [...existingRules, ...newRules];

  // Generate content for .windsurfrules
  const rulesContent = generateWindsurfRulesContent(allRules);

  // Write to .windsurfrules
  writeWindsurfRules(rulesContent);
}
