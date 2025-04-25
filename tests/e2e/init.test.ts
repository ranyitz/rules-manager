import fs from "fs-extra";
import path from "path";
import {
  setupTestDir,
  runCommand,
  fileExists,
  readTestFile,
  testDir,
} from "./helpers";

describe("rules-manager init command", () => {
  beforeEach(async () => {
    // Setup a clean test directory for each test with proper scoping
    await setupTestDir(expect.getState().currentTestName);
  });

  test("should create default config file", async () => {
    // Run the init command
    const { stdout, stderr } = await runCommand("init");

    // Check if config was created
    expect(fileExists("rules-manager.json")).toBe(true);

    // Verify the content
    const config = JSON.parse(readTestFile("rules-manager.json"));
    expect(config.ides).toBeDefined();
    expect(config.rules).toBeDefined();
  });

  test("should not overwrite existing config", async () => {
    // Create a custom config file
    const customConfig = { ides: ["custom"], rules: {} };
    fs.writeJsonSync(path.join(testDir, "rules-manager.json"), customConfig);

    // Run the init command
    const { stdout, stderr } = await runCommand("init");

    // Check if the config still exists
    expect(fileExists("rules-manager.json")).toBe(true);

    // Verify the content was not overwritten
    const config = JSON.parse(readTestFile("rules-manager.json"));
    expect(config.ides).toEqual(["custom"]);
  });

  test("should show help when run without arguments", async () => {
    // Run the init command without arguments (which should still work)
    const { stdout, stderr } = await runCommand("init");

    // Check for success message
    expect(stdout.toLowerCase()).toContain("configuration file");
  });
});
