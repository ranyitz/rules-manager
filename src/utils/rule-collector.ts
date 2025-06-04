import fs from "fs-extra";
import path from "node:path";
import { parseMdcFile } from "./mdc-parser";
import { RuleCollection, RuleContent } from "../types";

/**
 * Find the root directory of a package by name
 * @param packageName The name of the package
 * @returns The absolute path to the package's root directory
 */
export function findPackageRoot(packageName: string): string {
  try {
    // Method 1: Try to use require.resolve
    const packageEntry = require.resolve(packageName, {
      paths: [process.cwd()],
    });

    // Navigate up until we find a package.json or reach a reasonable limit
    let currentDir = path.dirname(packageEntry);
    let iterations = 0;
    const maxIterations = 3; // Prevent infinite loops

    while (iterations < maxIterations) {
      // If we found the package.json, this is likely the package root
      if (fs.existsSync(path.join(currentDir, "package.json"))) {
        return currentDir;
      }

      // Move up one directory
      const parentDir = path.dirname(currentDir);

      // If we've reached the root or haven't changed directory, stop
      if (parentDir === currentDir) {
        break;
      }

      currentDir = parentDir;
      iterations++;
    }

    // If we couldn't find package.json, use the directory of the entry point
    return path.dirname(packageEntry);
  } catch {
    // Method 2: Fall back to direct node_modules resolution
    const nodeModulesPath = path.resolve(
      process.cwd(),
      "node_modules",
      packageName,
    );

    if (!fs.existsSync(nodeModulesPath)) {
      throw new Error(`Package '${packageName}' not found in node_modules.`);
    }

    return nodeModulesPath;
  }
}

/**
 * Initialize an empty rule collection
 */
export function initRuleCollection(): RuleCollection {
  return {
    cursor: [],
    windsurf: [],
    codex: [],
  };
}

/**
 * Add a rule to the collection
 * @param collection The rule collection to add to
 * @param rule The rule content to add
 * @param ides The IDEs to add the rule for
 */
export function addRuleToCollection(
  collection: RuleCollection,
  rule: RuleContent,
  ides: string[],
): void {
  for (const ide of ides) {
    if (
      ide === "cursor" &&
      !collection.cursor.some((r) => r.name === rule.name)
    ) {
      collection.cursor.push(rule);
    } else if (
      ide === "windsurf" &&
      !collection.windsurf.some((r) => r.name === rule.name)
    ) {
      collection.windsurf.push(rule);
    } else if (
      ide === "codex" &&
      !collection.codex.some((r) => r.name === rule.name)
    ) {
      collection.codex.push(rule);
    }
  }
}

/**
 * Collect a rule from a local file source
 * @param ruleName The name of the rule
 * @param source The source path (relative or absolute)
 * @param ruleBasePath Optional base path for resolving relative paths
 * @returns The rule content
 */
export function collectLocalRule(
  ruleName: string,
  source: string | false,
  ruleBasePath?: string,
): RuleContent {
  if (source === false)
    throw new Error(
      `Rule '${ruleName}' is canceled and should not be processed.`,
    );
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

  // Parse the MDC file to extract metadata and content
  const { metadata, content } = parseMdcFile(sourcePath);

  return {
    name: ruleName,
    content,
    metadata,
    sourcePath,
  };
}

/**
 * Collect a rule from an npm package
 * @param ruleName The name of the rule
 * @param source The npm package source (can include path)
 * @returns The rule content
 */
export function collectNpmRule(
  ruleName: string,
  source: string | false,
): RuleContent {
  if (source === false)
    throw new Error(
      `Rule '${ruleName}' is canceled and should not be processed.`,
    );
  // Parse source into package and file path
  let packageName: string;
  let packagePath: string;

  if (source.includes("/") && !source.startsWith("@")) {
    // Format: "package-name/path/to/file.mdc"
    const firstSlash = source.indexOf("/");
    packageName = source.substring(0, firstSlash);
    packagePath = source.substring(firstSlash + 1);
  } else if (source.startsWith("@")) {
    // Format: "@scope/package/path/to/file.mdc"
    const parts = source.split("/");
    // @scope/package
    packageName = `${parts[0]}/${parts[1]}`;
    // Remaining path, if any
    packagePath = parts.slice(2).join("/");
  } else {
    // Format: "package-name" (whole package)
    packageName = source;
    packagePath = "";
  }

  // Try to find the package and get its root directory
  const packageRoot = findPackageRoot(packageName);

  // Resolve the full path to the rule file
  const ruleFile = packagePath
    ? path.join(packageRoot, packagePath)
    : packageRoot;

  if (!fs.existsSync(ruleFile)) {
    throw new Error(`Rule file not found in package: ${ruleFile}`);
  }

  // Parse the MDC file to extract metadata and content
  const { metadata, content } = parseMdcFile(ruleFile);

  return {
    name: ruleName,
    content,
    metadata,
    sourcePath: ruleFile,
  };
}
