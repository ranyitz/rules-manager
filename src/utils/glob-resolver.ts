import path from "node:path";

// Helper function to dynamically import globby
async function getGlobby() {
  const { globby } = await import("globby");
  return globby;
}

export async function resolveGlobRules(
  globPattern: string,
  baseDir: string,
): Promise<Record<string, string>> {
  const globby = await getGlobby();
  const files = await globby(globPattern, {
    cwd: baseDir,
    absolute: true, // Ensure absolute paths
    onlyFiles: true, // We only want files
  });

  const resolvedRules: Record<string, string> = {};

  for (const filePath of files) {
    const ruleName = path.basename(filePath, ".mdc");
    // Potentially add more extensions to strip, e.g. path.basename(filePath).replace(/\.(mdc|md)$/, '')
    resolvedRules[ruleName] = filePath;
  }

  return resolvedRules;
}
