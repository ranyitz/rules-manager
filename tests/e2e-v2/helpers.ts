import fs from "fs-extra";
import path from "node:path";
import { execSync } from "child_process";

let testCounter = 0;

/**
 * Get a unique test directory for each test
 */
export function getTestDir(): string {
  return path.join(__dirname, `../tmp-test-v2-${Date.now()}-${++testCounter}`);
}

/**
 * Setup test directory from a fixture
 */
export async function setupFromFixture(fixtureName: string): Promise<string> {
  const testDir = getTestDir();
  const fixtureDir = path.join(__dirname, "../fixtures-v2", fixtureName);

  // Clean and create test directory
  if (fs.existsSync(testDir)) {
    fs.removeSync(testDir);
  }
  fs.mkdirSync(testDir, { recursive: true });

  // Copy fixture to test directory
  if (fs.existsSync(fixtureDir)) {
    fs.copySync(fixtureDir, testDir);
  }

  // Change to test directory
  process.chdir(testDir);
  return testDir;
}

/**
 * Setup empty test directory
 */
export async function setupTestDir(): Promise<string> {
  const testDir = getTestDir();

  // Clean and create test directory
  if (fs.existsSync(testDir)) {
    fs.removeSync(testDir);
  }
  fs.mkdirSync(testDir, { recursive: true });

  // Change to test directory
  process.chdir(testDir);
  return testDir;
}

/**
 * Run a command using the v2 CLI
 */
export async function runCommand(
  command: string,
  testDir?: string,
): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const aicmV2Path = path.join(__dirname, "../../dist/bin/aicm_v2.js");
    const fullCommand = `node ${aicmV2Path} ${command}`;

    const stdout = execSync(fullCommand, {
      cwd: testDir || process.cwd(),
      encoding: "utf8",
      stdio: "pipe",
    });

    return { stdout, stderr: "", code: 0 };
  } catch (error: unknown) {
    const execError = error as {
      stdout?: string;
      stderr?: string;
      message?: string;
      status?: number;
    };
    return {
      stdout: execError.stdout || "",
      stderr: execError.stderr || execError.message || "",
      code: execError.status || 1,
    };
  }
}

/**
 * Run a command that is expected to fail
 */
export async function runFailedCommand(
  command: string,
  testDir?: string,
): Promise<{ stdout: string; stderr: string; code: number }> {
  const result = await runCommand(command, testDir);
  if (result.code === 0) {
    throw new Error(`Expected command to fail, but it succeeded: ${command}`);
  }
  return result;
}

/**
 * Check if a file exists in the given directory
 */
export function fileExists(relativePath: string, testDir?: string): boolean {
  const baseDir = testDir || process.cwd();
  return fs.existsSync(path.join(baseDir, relativePath));
}

/**
 * Read a file from the given directory
 */
export function readTestFile(relativePath: string, testDir?: string): string {
  const baseDir = testDir || process.cwd();
  return fs.readFileSync(path.join(baseDir, relativePath), "utf8");
}

/**
 * Write a file to the given directory
 */
export function writeTestFile(
  relativePath: string,
  content: string,
  testDir?: string,
): void {
  const baseDir = testDir || process.cwd();
  const fullPath = path.join(baseDir, relativePath);
  fs.ensureDirSync(path.dirname(fullPath));
  fs.writeFileSync(fullPath, content);
}

/**
 * Clean up a specific test directory
 */
export function cleanup(testDir?: string): void {
  if (testDir && fs.existsSync(testDir)) {
    fs.removeSync(testDir);
  }
}

/**
 * Clean up all v2 test directories
 */
export function cleanupAll(): void {
  const tmpDir = path.join(__dirname, "..");
  const files = fs.readdirSync(tmpDir);

  for (const file of files) {
    if (file.startsWith("tmp-test-v2-")) {
      const fullPath = path.join(tmpDir, file);
      if (fs.existsSync(fullPath)) {
        fs.removeSync(fullPath);
      }
    }
  }
}
