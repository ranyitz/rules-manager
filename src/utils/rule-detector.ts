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

  try {
    const packageName = source.split(/[/\\]/)[0];
    require.resolve(packageName, { paths: [__dirname, process.cwd()] });
    return "npm";
  } catch {
    return "local";
  }
}
