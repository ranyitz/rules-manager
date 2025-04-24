import fs from "fs-extra";
import path from "path";
import {
  setupTestDir,
  runCommand,
  fileExists,
  readTestFile,
  testDir,
} from "./helpers";

describe("ai-rules init command", () => {
  beforeEach(async () => {
    // Setup a clean test directory for each test with proper scoping
    await setupTestDir("init.test.ts", expect.getState().currentTestName);
  });

  test("should create default config file", async () => {
    // Run the init command
    const { stdout, stderr } = await runCommand("init");

    // Check if config was created
    expect(fileExists("ai-rules.json")).toBe(true);

    // Verify the content
    const config = JSON.parse(readTestFile("ai-rules.json"));
    expect(config.ides).toBeDefined();
    expect(config.rules).toBeDefined();
  });

  test("should not overwrite existing config by default", async () => {
    // Create a custom config file
    const customConfig = { ides: ["custom"], rules: {} };
    fs.writeJsonSync(path.join(testDir, "ai-rules.json"), customConfig);

    // Run the init command
    const { stdout, stderr } = await runCommand("init");

    // Check if the config still exists
    expect(fileExists("ai-rules.json")).toBe(true);

    // Verify the content was not overwritten
    const config = JSON.parse(readTestFile("ai-rules.json"));
    expect(config.ides).toEqual(["custom"]);
  });

  test("should overwrite existing config with --force flag", async () => {
    // Create a custom config file
    const customConfig = { ides: ["custom"], rules: {} };
    fs.writeJsonSync(path.join(testDir, "ai-rules.json"), customConfig);

    // Run the init command with force flag
    const { stdout, stderr } = await runCommand("init --force");

    // Check if the config was overwritten
    expect(fileExists("ai-rules.json")).toBe(true);

    // Verify the content was overwritten
    const config = JSON.parse(readTestFile("ai-rules.json"));
    expect(config.ides).not.toEqual(["custom"]);
  });

  test("should show help when run without arguments", async () => {
    // Run the init command without arguments (which should still work)
    const { stdout, stderr } = await runCommand("init");

    // Check for success message
    expect(stdout.toLowerCase()).toContain("configuration file");
  });
});
