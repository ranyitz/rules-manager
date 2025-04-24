import path from "path";
import fs from "fs-extra";
import {
  setupTestDir,
  runCommand,
  fileExists,
  readTestFile,
  testDir,
} from "./helpers";

describe("ai-rules init command", () => {
  // Get the current filename for our directory structure
  const testFilename = path.basename(__filename);

  beforeEach(async () => {
    // Don't setup test directories here since we'll do it per test
  });

  test("should create default config file", async () => {
    // Setup a dedicated test directory
    await setupTestDir(testFilename, "create-default-config");

    const { stdout, stderr } = await runCommand("init");

    // Config should be created in the test directory
    const configPath = path.join(testDir, "ai-rules.json");
    expect(fs.existsSync(configPath)).toBe(true);

    // Config should contain default structure with IDEs and rules
    const config = await fs.readJson(configPath);
    expect(config).toHaveProperty("ides");
    expect(config).toHaveProperty("rules");
    expect(typeof config.rules).toBe("object");
  });

  test("should not overwrite existing config by default", async () => {
    // Setup a dedicated test directory
    await setupTestDir(testFilename, "no-overwrite-config");

    // Create a config file with custom content
    const configPath = path.join(testDir, "ai-rules.json");
    const customConfig = { rules: ["custom-rule"] };
    await fs.writeJson(configPath, customConfig);

    // Run init command
    const { stdout, stderr } = await runCommand("init");

    // Check if output mentions the file exists
    expect(stdout).toMatch(/exist|already|found/i);

    // Config should still contain our custom values
    const config = await fs.readJson(configPath);
    expect(config.rules).toEqual(["custom-rule"]);
  });

  test("should overwrite existing config with --force flag", async () => {
    // Setup a dedicated test directory
    await setupTestDir(testFilename, "overwrite-with-force");

    // Create a config file with custom content
    const configPath = path.join(testDir, "ai-rules.json");
    const customConfig = { rules: ["custom-rule"] };
    await fs.writeJson(configPath, customConfig);

    // Run init command with force flag
    const { stdout, stderr } = await runCommand("init --force");

    // Config should be reset to default structure
    const config = await fs.readJson(configPath);
    expect(config).toHaveProperty("ides");
    expect(config).toHaveProperty("rules");
    expect(typeof config.rules).toBe("object");
    // Make sure our custom rule is no longer there
    expect(config.rules).not.toEqual(["custom-rule"]);
  });

  test("should show help when run without arguments", async () => {
    // Setup a dedicated test directory
    await setupTestDir(testFilename, "show-help");

    // Run the command with no arguments
    const { stdout, stderr } = await runCommand("");

    // Should show usage information
    expect(stdout.toLowerCase()).toMatch(/usage/);
  });
});
