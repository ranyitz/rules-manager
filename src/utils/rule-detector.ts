import path from "node:path";

/**
 * Detects the rule type from the source string
 */
export function detectRuleType(source: string): "npm" | "local" {
  if (source.startsWith("http://") || source.startsWith("https://")) {
    throw new Error(
      "URL-based rules are not supported due to security concerns. Please use npm packages or local files instead."
    );
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
