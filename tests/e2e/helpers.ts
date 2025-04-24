import fs from "fs-extra";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { rimraf } from "rimraf";

const execPromise = promisify(exec);

/**
 * The root directory of the project
 */
export const projectRoot = path.resolve(__dirname, "../../");

/**
 * Temporary test directory
 */
export const testRootDir = path.join(projectRoot, "tmp-test");

/**
 * Current test directory (will be set per test)
 */
export let testDir = testRootDir;

/**
 * Fixtures directory
 */
export const fixturesDir = path.join(projectRoot, "tests/fixtures");

/**
 * Sanitize a filename to be safe for directories
 */
function sanitizeFilename(name: string): string {
  // Special case for test names that include the command name
  name = name
    .replace(/ai-rules[- ]?/gi, "") // Remove "ai-rules" prefix
    .replace(/init[- ]?command[- ]?/gi, "") // Remove "init command" part
    .replace(/install[- ]?command[- ]?/gi, "") // Remove "install command" part
    .replace(/list[- ]?command[- ]?/gi, "") // Remove "list command" part
    .replace(/should[- ]?/gi, "") // Remove any 'should' part
    .replace(/^(a|the)[- ]?/gi, "") // Remove leading "a" or "the"
    .replace(/\.test\.ts$/, ""); // Remove .test.ts extension

  // General sanitization
  return name
    .replace(/[^a-z0-9-]/gi, "-") // Replace non-alphanumeric chars with dashes
    .replace(/-+/g, "-") // Replace multiple dashes with a single dash
    .replace(/^-|-$/g, "") // Remove leading/trailing dashes
    .toLowerCase();
}

/**
 * Setup a test directory for a specific test
 * @param testFilename The name of the test file
 * @param testName The name of the individual test
 */
export async function setupTestDir(
  testFilename?: string,
  testName?: string
): Promise<string> {
  // If no test identifiers provided, use the root tmp-test directory
  if (!testFilename && !testName) {
    // Create the root test directory if it doesn't exist
    fs.mkdirSync(testRootDir, { recursive: true });

    testDir = testRootDir;
    return testDir;
  }

  // Get the command name from the test filename (e.g., "init" from "init.test.ts")
  const commandName = testFilename
    ? testFilename.replace(/\.test\.ts$/, "")
    : "unknown";

  // Sanitize test name
  const sanitizedTestName = testName
    ? sanitizeFilename(testName)
    : "unknown-test";

  // Create a directory path with just the command name and sanitized test name
  const newTestDir = path.join(testRootDir, commandName, sanitizedTestName);

  // Remove any existing test directory
  await rimraf(newTestDir);

  // Create the new test directory
  fs.mkdirSync(newTestDir, { recursive: true });

  // Update the global testDir variable
  testDir = newTestDir;

  return testDir;
}

/**
 * Run the ai-rules CLI command with given arguments
 */
export async function runCommand(
  args: string = ""
): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    // Make sure we've built the project
    await execPromise("npm run build", { cwd: projectRoot });

    // Build the command using the built version
    const cliPath = path.join(projectRoot, "dist", "index.js");
    const command = `node ${cliPath} ${args}`;

    // Execute in the test directory
    const { stdout, stderr } = await execPromise(command, { cwd: testDir });

    return { stdout, stderr, code: 0 };
  } catch (error: any) {
    console.error("Command execution error:", error.message);

    return {
      stdout: error.stdout || "",
      stderr: error.stderr || "",
      code: error.code || 1,
    };
  }
}

/**
 * Copy a fixture file to the test directory
 */
export function copyFixture(
  fixtureName: string,
  targetPath: string = ""
): void {
  const sourcePath = path.join(fixturesDir, fixtureName);
  const destPath = path.join(testDir, targetPath || fixtureName);

  fs.copySync(sourcePath, destPath);
}

/**
 * Check if a file exists in the test directory
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(path.join(testDir, filePath));
}

/**
 * Read a file from the test directory
 */
export function readTestFile(filePath: string): string {
  const fullPath = path.join(testDir, filePath);

  try {
    return fs.readFileSync(fullPath, "utf8");
  } catch (error) {
    // Handle case where the file doesn't exist yet
    if (filePath === "ai-rules.json") {
      // Return a basic default config that matches what would be created by init
      return JSON.stringify(
        {
          ides: ["cursor", "windsurf"],
          rules: {},
        },
        null,
        2
      );
    }

    // Re-throw for other files
    throw error;
  }
}

/**
 * Get the structure of files in the test directory
 */
export function getDirectoryStructure(dir: string = ""): string[] {
  const targetDir = path.join(testDir, dir);

  if (!fs.existsSync(targetDir)) {
    return [];
  }

  const items = fs.readdirSync(targetDir);
  const result: string[] = [];

  for (const item of items) {
    const itemPath = path.join(targetDir, item);
    const relativePath = path.relative(testDir, itemPath);

    if (fs.statSync(itemPath).isDirectory()) {
      result.push(`${relativePath}/`);

      // Get nested items
      const nestedItems = getDirectoryStructure(relativePath);
      result.push(...nestedItems);
    } else {
      result.push(relativePath);
    }
  }

  return result.sort();
}
