import {
  setupFromFixture,
  runCommand,
  fileExists,
  readTestFile,
} from "./helpers";
import fs from "fs-extra";
import path from "path";
import { testDir } from "./helpers";

describe("rules-manager init command with fixtures", () => {
  test("should create default config file", async () => {
    // Setup the test directory using an empty fixture
    await setupFromFixture("init-empty", expect.getState().currentTestName);

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
    // Setup the test directory using an empty fixture
    await setupFromFixture("init-empty", expect.getState().currentTestName);

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
});
