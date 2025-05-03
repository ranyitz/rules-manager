import fs from "fs-extra";

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

  const metadata: Record<string, boolean | string | string[]> = {};

  metadataStr.split("\n").forEach((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex !== -1) {
      const key = line.substring(0, colonIndex).trim();
      const valueStr = line.substring(colonIndex + 1).trim();

      // Handle different value types
      let value: boolean | string | string[] = "";

      if (valueStr === "true") {
        value = true;
      } else if (valueStr === "false") {
        value = false;
      } else if (valueStr.startsWith('"') && valueStr.endsWith('"')) {
        // Remove quotes from string values
        value = valueStr.substring(1, valueStr.length - 1);
      } else {
        // Default to using the string value as is
        value = valueStr;
      }

      metadata[key] = value;
    }
  });

  return {
    metadata,
    content,
  };
}
