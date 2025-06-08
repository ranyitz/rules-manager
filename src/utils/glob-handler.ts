import path from "node:path";
import fg from "fast-glob";

/**
 * Check if a rule source string contains glob patterns
 */
export function isGlobPattern(source: string): boolean {
  return /[*?{}[\]]/.test(source);
}

/**
 * Expand a glob pattern to matching .mdc files
 * @param pattern The glob pattern to expand
 * @param basePath The base path to resolve relative patterns from
 * @returns Array of file paths that match the pattern
 */
export async function expandGlobPattern(
  pattern: string,
  basePath?: string,
): Promise<string[]> {
  // Normalize the pattern to use forward slashes for consistent behavior
  const normalizedPattern = pattern.replace(/\\/g, "/");

  try {
    const matches = await fg(normalizedPattern, {
      ignore: ["**/.*"], // Ignore hidden files
      absolute: false,
      onlyFiles: true,
      // Set the working directory if basePath is provided
      cwd: basePath,
    });

    // Filter to only .mdc files, normalize paths, and sort for deterministic behavior
    return matches
      .filter((file: string) => file.endsWith(".mdc"))
      .map((file: string) => file.replace(/\\/g, "/")) // Normalize Windows backslashes to forward slashes
      .sort((a: string, b: string) => a.localeCompare(b));
  } catch (error) {
    throw new Error(
      `Error expanding glob pattern "${pattern}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Synchronous version of expandGlobPattern for use during config loading
 */

/**
 * Generate a rule key from a file path and base key
 * @param filePath The discovered file path
 * @param baseKey The base key from the object notation
 * @param patternBase The base directory of the glob pattern
 * @returns Generated rule key with namespace
 */
export function generateGlobRuleKey(
  filePath: string,
  baseKey: string,
  patternBase: string,
): string {
  // Normalize paths to use forward slashes for consistent behavior
  const normalizedFilePath = filePath.replace(/\\/g, "/");
  const normalizedPatternBase = patternBase.replace(/\\/g, "/");

  // Get the relative path from the pattern base to the file
  const relativePath = path.posix.relative(
    normalizedPatternBase,
    normalizedFilePath,
  );

  // Remove .mdc extension
  const withoutExtension = relativePath.replace(/\.mdc$/, "");

  // Return the combined key
  return `${baseKey}/${withoutExtension}`;
}

/**
 * Get the base directory from a glob pattern
 * @param pattern The glob pattern
 * @returns The base directory path without glob characters
 */
export function getGlobBase(pattern: string): string {
  // Normalize path separators to forward slashes for consistent behavior
  const normalizedPattern = pattern.replace(/\\/g, "/");

  // Find the first occurrence of glob characters
  const globIndex = normalizedPattern.search(/[*?{}[\]]/);

  if (globIndex === -1) {
    // No glob characters, return the directory
    return path.dirname(normalizedPattern);
  }

  // Get the path up to the first glob character
  const basePath = normalizedPattern.substring(0, globIndex);

  // Find the last path separator before the glob
  const lastSeparator = basePath.lastIndexOf("/");

  if (lastSeparator === -1) {
    return ".";
  }

  return basePath.substring(0, lastSeparator);
}

/**
 * Expand glob patterns in rules object and return normalized rules
 * @param rules The rules object that may contain glob patterns
 * @param basePath The base path to resolve relative patterns from
 * @returns Object with expanded rules and metadata about sources
 */
export async function expandRulesGlobPatterns(
  rules: Record<string, string | false>,
  basePath?: string,
): Promise<{
  expandedRules: Record<string, string>;
  globSources: Record<string, string>; // Maps expanded rule key to original glob pattern
}> {
  const expandedRules: Record<string, string> = {};
  const globSources: Record<string, string> = {};

  for (const [key, source] of Object.entries(rules)) {
    if (source === false) {
      continue; // Skip canceled rules
    }

    if (isGlobPattern(source)) {
      // Expand glob pattern
      try {
        const matchedFiles = await expandGlobPattern(source, basePath);

        if (matchedFiles.length === 0) {
          console.warn(`Warning: Glob pattern "${source}" matched no files`);
          continue;
        }

        const patternBase = getGlobBase(source);

        for (const filePath of matchedFiles) {
          const generatedKey = generateGlobRuleKey(filePath, key, patternBase);
          expandedRules[generatedKey] = filePath;
          globSources[generatedKey] = source;
        }
      } catch (error) {
        throw new Error(
          `Error processing glob pattern for key "${key}": ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    } else {
      // Regular file path
      expandedRules[key] = source;
    }
  }

  return { expandedRules, globSources };
}
