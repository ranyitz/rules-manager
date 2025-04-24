import path from "node:path";

/**
 * Detects the rule type from the source string
 */
export function detectRuleType(source: string): "url" | "npm" | "local" {
  // Check if it's a URL
  if (source.startsWith("http://") || source.startsWith("https://")) {
    return "url";
  }

  // Check if it's an npm package (starts with @ or doesn't contain path separators)
  if (
    source.startsWith("@") ||
    (!source.includes("/") && !source.includes("\\"))
  ) {
    return "npm";
  }

  // Otherwise assume it's a local path
  return "local";
}
