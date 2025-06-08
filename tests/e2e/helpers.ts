import fs from "fs-extra";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { rimraf } from "rimraf";

const execPromise = promisify(exec);

interface ExecError extends Error {
  stdout?: string;
  stderr?: string;
  code?: number;
}

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
 * E2E test fixtures directory
 */
export const e2eFixturesDir = path.join(projectRoot, "tests/fixtures");

/**
 * Sanitize a filename to be safe for directories
 */
function sanitizeFilename(name: string): string {
  // General sanitization
  return name
    .replace(/\.test\.ts$/, "") // Remove .test.ts extension
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
export async function setupTestDir(): Promise<string> {
  const testPath = expect.getState().testPath!;
  const testFileName = path.basename(testPath, ".test.ts");
  const testName = expect.getState().currentTestName;

  // Sanitize test name
  // If no test identifiers provided, use the root tmp-test directory
  if (!testName) {
    // Create the root test directory if it doesn't exist
    fs.mkdirSync(testRootDir, { recursive: true });

    testDir = testRootDir;
    return testDir;
  }

  const sanitizedTestName = testName
    ? sanitizeFilename(testName)
    : "unknown-test";

  // Create a directory path with just the command name and sanitized test name
  const newTestDir = path.join(testRootDir, testFileName, sanitizedTestName);

  // Remove any existing test directory
  await rimraf(newTestDir);

  // Create the new test directory
  fs.mkdirSync(newTestDir, { recursive: true });

  // Update the global testDir variable
  testDir = newTestDir;

  return testDir;
}

/**
 * Run a command expecting success (exit code 0)
 * Throws with detailed debugging info if the command fails
 */
export async function runCommand(
  args: string = "",
  options: { env?: Record<string, string> } = {},
): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const cliPath = path.join(projectRoot, "dist", "bin", "aicm.js");
    const command = `node ${cliPath} ${args}`;

    const { stdout, stderr } = await execPromise(command, {
      cwd: testDir,
      env: options.env ? { ...process.env, ...options.env } : process.env,
    });

    const result = { stdout, stderr, code: 0 };

    // Command succeeded as expected
    return result;
  } catch (error: unknown) {
    const execError = error as ExecError;
    const result = {
      stdout: execError.stdout || "",
      stderr: execError.stderr || "",
      code: execError.code || 1,
    };

    // Command failed when we expected success - show debugging info
    console.error("\n=== COMMAND EXECUTION FAILED (Expected Success) ===");
    console.error(
      `Command: node ${path.join(projectRoot, "dist", "bin", "aicm.js")} ${args}`,
    );
    console.error(`Working Directory: ${testDir}`);
    console.error(`Expected exit code: 0`);
    console.error(`Actual exit code: ${result.code}`);
    console.error("\n--- STDOUT ---");
    console.error(result.stdout || "(empty)");
    console.error("\n--- STDERR ---");
    console.error(result.stderr || "(empty)");
    console.error("=== END COMMAND FAILURE ===\n");

    throw new Error(
      `Command "${args}" failed with exit code ${result.code}, expected success (0)`,
    );
  }
}

/**
 * Run a command expecting failure (exit code 1)
 * Throws with detailed debugging info if the command succeeds instead
 */
export async function runFailedCommand(
  args: string = "",
  options: { env?: Record<string, string> } = {},
): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const cliPath = path.join(projectRoot, "dist", "bin", "aicm.js");
    const command = `node ${cliPath} ${args}`;

    const { stdout, stderr } = await execPromise(command, {
      cwd: testDir,
      env: options.env ? { ...process.env, ...options.env } : process.env,
    });

    const result = { stdout, stderr, code: 0 };

    // Command succeeded when we expected failure - show debugging info
    console.error("\n=== COMMAND EXECUTION SUCCEEDED (Expected Failure) ===");
    console.error(`Command: ${command}`);
    console.error(`Working Directory: ${testDir}`);
    console.error(`Expected exit code: 1`);
    console.error(`Actual exit code: ${result.code}`);
    console.error("\n--- STDOUT ---");
    console.error(result.stdout || "(empty)");
    console.error("\n--- STDERR ---");
    console.error(result.stderr || "(empty)");
    console.error("=== END UNEXPECTED SUCCESS ===\n");

    throw new Error(
      `Command "${args}" succeeded with exit code ${result.code}, expected failure (1)`,
    );
  } catch (error: unknown) {
    const execError = error as ExecError;
    const result = {
      stdout: execError.stdout || "",
      stderr: execError.stderr || "",
      code: execError.code || 1,
    };

    // Command failed as expected
    return result;
  }
}

/**
 * Run a command without asserting exit code (original behavior)
 * Use this when you want to manually check the exit code in your test
 */
export async function runCommandRaw(
  args: string = "",
  options: { env?: Record<string, string> } = {},
): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const cliPath = path.join(projectRoot, "dist", "bin", "aicm.js");
    const command = `node ${cliPath} ${args}`;

    const { stdout, stderr } = await execPromise(command, {
      cwd: testDir,
      env: options.env ? { ...process.env, ...options.env } : process.env,
    });

    return { stdout, stderr, code: 0 };
  } catch (error: unknown) {
    const execError = error as ExecError;

    return {
      stdout: execError.stdout || "",
      stderr: execError.stderr || "",
      code: execError.code || 1,
    };
  }
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
  return fs.readFileSync(fullPath, "utf8");
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

/**
 * Setup a test directory using a fixture directory
 * @param fixtureName The name of the fixture directory to use
 */
export async function setupFromFixture(fixtureName: string): Promise<string> {
  // First setup a clean test directory
  await setupTestDir();

  const fixtureDir = path.join(e2eFixturesDir, fixtureName);

  if (!fs.existsSync(fixtureDir)) {
    throw new Error(`Fixture directory not found: ${fixtureName}`);
  }

  fs.copySync(fixtureDir, testDir);

  await execPromise("git init", { cwd: testDir });

  return testDir;
}

/**
 * Run npm install for a specific package in the test directory
 * @param packageName The npm package to install
 */
export async function runNpmInstall(
  packageName: string,
): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const command = `npm install --no-save ${packageName}`;
    const { stdout, stderr } = await execPromise(command, { cwd: testDir });
    return { stdout, stderr, code: 0 };
  } catch (error: unknown) {
    const execError = error as ExecError;
    return {
      stdout: execError.stdout || "",
      stderr: execError.stderr || "",
      code: execError.code || 1,
    };
  }
}
