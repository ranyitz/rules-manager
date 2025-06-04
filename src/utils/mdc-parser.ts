import fs from "fs-extra";
import yaml from "yaml";

/**
 * Parse an MDC file and extract its content
 * MDC files are Markdown files with metadata
 * https://docs.cursor.com/context/rules
 */
export function parseMdcFile(filePath: string): {
  metadata: Record<string, boolean | string | string[]>;
  content: string;
} {
  const fileContent = fs.readFileSync(filePath, "utf8");

  if (!fileContent.startsWith("---")) {
    return {
      metadata: {},
      content: fileContent,
    };
  }

  const endOfMetadata = fileContent.indexOf("---", 3);
  if (endOfMetadata === -1) {
    return {
      metadata: {},
      content: fileContent,
    };
  }

  const metadataStr = fileContent.substring(3, endOfMetadata).trim();
  const content = fileContent.substring(endOfMetadata + 3).trim();

  let metadata: Record<string, boolean | string | string[]> = {};

  if (metadataStr.length > 0) {
    try {
      const parsed = yaml.parse(metadataStr);
      if (parsed && typeof parsed === "object") {
        metadata = parsed as Record<string, boolean | string | string[]>;
      }
    } catch (e) {
      throw new Error(
        `Invalid metadata in ${filePath}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
  return {
    metadata,
    content,
  };
}
