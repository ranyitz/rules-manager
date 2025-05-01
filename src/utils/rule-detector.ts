import path from "node:path";
import fs from "fs-extra";

/**
 * Detects the rule type from the source string
 */
export function detectRuleType(source: string): "npm" | "local" {
  if (source.startsWith("http://") || source.startsWith("https://")) {
    throw new Error(
      "URL-based rules are not supported due to security concerns. Please use npm packages or local files instead.",
    );
  }

  // Check if it's a local file path
  if (
    source.startsWith("/") ||
    source.startsWith("./") ||
    source.startsWith("../") ||
    source.startsWith("\\") ||
    source.startsWith(".\\") ||
    (source.includes(":\\") && source.includes("\\")) || // Windows absolute path with backslash
    (source.includes(":") &&
      (source.startsWith("file:") || source.includes(":\\"))) // Path with protocol or Windows drive letter
  ) {
    return "local";
  }

  // Check if it's an npm package with a direct node_modules reference
  const packageName = source.split(/[\/\\]/)[0]; // Support both slash types
  if (fs.existsSync(path.resolve(process.cwd(), "node_modules", packageName))) {
    return "npm";
  }

  // Try to interpret as npm package
  try {
    require.resolve(packageName, { paths: [process.cwd()] });
    return "npm";
  } catch (e) {
    // If we couldn't resolve it as an npm package, assume it's a local path
    return "local";
  }
}
