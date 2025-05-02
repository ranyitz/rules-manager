import fs from "fs-extra";
import path from "path";

const RULES_BEGIN = "<!-- RULES-MANAGER:BEGIN -->";
const RULES_END = "<!-- RULES-MANAGER:END -->";
const WARNING =
  "<!-- WARNING: Everything between these markers will be overwritten during installation -->";

/**
 * Write rules to the .windsurfrules file
 * This will update the content between the RULES_BEGIN and RULES_END markers
 * If the file doesn't exist, it will create it
 * If the markers don't exist, it will append them to the existing content
 */
export function writeWindsurfRules(
  rulesContent: string,
  rulesFilePath: string = path.join(process.cwd(), ".windsurfrules"),
): void {
  let fileContent = "";

  // Check if file exists
  if (fs.existsSync(rulesFilePath)) {
    fileContent = fs.readFileSync(rulesFilePath, "utf8");

    // Check if our markers exist
    if (fileContent.includes(RULES_BEGIN) && fileContent.includes(RULES_END)) {
      // Replace content between markers
      const beforeMarker = fileContent.split(RULES_BEGIN)[0];
      const afterMarker = fileContent.split(RULES_END)[1];
      fileContent =
        beforeMarker +
        RULES_BEGIN +
        "\n" +
        WARNING +
        "\n\n" +
        rulesContent +
        "\n\n" +
        RULES_END +
        afterMarker;
    } else {
      // Preserve the existing content and append markers
      const existingContent = fileContent;

      // Ensure there's proper spacing between existing content and markers
      let separator = "";
      if (!existingContent.endsWith("\n")) {
        separator += "\n";
      }

      // Add an extra line if the file doesn't already end with multiple newlines
      if (!existingContent.endsWith("\n\n")) {
        separator += "\n";
      }

      // Create the new file content with preserved original content
      fileContent =
        existingContent +
        separator +
        RULES_BEGIN +
        "\n" +
        WARNING +
        "\n\n" +
        rulesContent +
        "\n\n" +
        RULES_END;
    }
  } else {
    // Create new file with markers and content
    fileContent =
      RULES_BEGIN + "\n" + WARNING + "\n\n" + rulesContent + "\n\n" + RULES_END;
  }

  fs.writeFileSync(rulesFilePath, fileContent);
}

/**
 * Generate the Windsurf rules content based on rule files
 */
export function generateWindsurfRulesContent(
  ruleFiles: { name: string; path: string; metadata: Record<string, any> }[],
): string {
  const alwaysRules: string[] = [];
  const autoAttachedRules: Array<{ path: string; pattern: string }> = [];
  const agentRequestedRules: string[] = [];
  const manualRules: string[] = [];

  ruleFiles.forEach(({ name, path, metadata }) => {
    // Determine rule type based on metadata
    if (
      metadata.type === "always" ||
      metadata.alwaysApply === true ||
      metadata.alwaysApply === "true"
    ) {
      alwaysRules.push(path);
    } else if (
      metadata.type === "auto-attached" ||
      metadata.globs ||
      metadata.filePattern
    ) {
      // Get the glob pattern from metadata
      const pattern =
        metadata.filePattern ||
        (metadata.globs &&
          (Array.isArray(metadata.globs)
            ? metadata.globs.join(", ")
            : metadata.globs)) ||
        "*";
      autoAttachedRules.push({ path, pattern });
    } else if (metadata.type === "agent-requested" || metadata.description) {
      agentRequestedRules.push(path);
    } else {
      // Default to manual inclusion
      manualRules.push(path);
    }
  });

  // Generate the content
  let content = "";

  // Always rules
  if (alwaysRules.length > 0) {
    content +=
      "The following rules always apply to all files in the project:\n";
    alwaysRules.forEach((rule) => {
      content += `- ${rule}\n`;
    });
    content += "\n";
  }

  // Auto Attached rules
  if (autoAttachedRules.length > 0) {
    content +=
      "The following rules are automatically attached to matching glob patterns:\n";
    autoAttachedRules.forEach((rule) => {
      content += `- [${rule.pattern}] ${rule.path}\n`;
    });
    content += "\n";
  }

  // Agent Requested rules
  if (agentRequestedRules.length > 0) {
    content +=
      "The following rules are available for the AI to include when needed:\n";
    agentRequestedRules.forEach((rule) => {
      content += `- ${rule}\n`;
    });
    content += "\n";
  }

  // Manual rules
  if (manualRules.length > 0) {
    content +=
      "The following rules are only included when explicitly referenced:\n";
    manualRules.forEach((rule) => {
      content += `- ${rule}\n`;
    });
    content += "\n";
  }

  return content.trim();
}
