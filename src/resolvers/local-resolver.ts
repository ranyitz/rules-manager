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

    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source file ${sourcePath} not found.`);
    }

    const ruleContent = fs.readFileSync(sourcePath, "utf8");

    const idePaths = getIdePaths();

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

        // Create the rule files
        const ruleFile = path.join(ruleDir, `${ruleName}.md`);
        fs.writeFileSync(ruleFile, content);

        windsurfRules.push({
          name: ruleName,
          path: `.rules/${ruleName}.md`,
          metadata,
        });
      }
    }

    // If Windsurf is one of the IDEs, update the .windsurfrules file
    if (ides.includes("windsurf") && windsurfRules.length > 0) {
      const windsurfRulesContent = generateWindsurfRulesContent(windsurfRules);

      // Write to .windsurfrules
      writeWindsurfRules(windsurfRulesContent);
    }

    return true;
  } catch (error) {
    // Re-throw the error instead of logging it
    throw error;
  }
}
