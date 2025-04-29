import path from "path";
import fs from "fs-extra";
import { setupTestDir, runCommand, testDir, readTestFile } from "./helpers";

describe("rules-manager list command", () => {
  beforeEach(async () => {
    // Setup a clean test directory for each test with proper scoping
    await setupTestDir(expect.getState().currentTestName);
  });

  // Get the current filename for our directory structure
  const testFilename = path.basename(__filename);

  test("should list all rules in the config", async () => {
    // Initialize the config
    await runCommand("init");

    // Create a config file with multiple rules manually
    const config = JSON.parse(readTestFile("rules-manager.json"));
    config.rules = {
      rule1: "./rules/rule1.mdc",
      rule2: "@company/rules/rule2.mdc",
      rule3: "./rules/rule3.mdc",
    };
    fs.writeFileSync(
      path.join(testDir, "rules-manager.json"),
      JSON.stringify(config, null, 2),
    );

    // List the rules
    const { stdout, stderr, code } = await runCommand("list");

    // Command should run successfully
    expect(code).toBe(0);

    // Verify all rules are listed in the output
    expect(stdout).toContain("rule1");
    expect(stdout).toContain("rule2");
    expect(stdout).toContain("rule3");
  });

  test("should show message when no rules exist", async () => {
    // Initialize the config
    await runCommand("init");

    // Create a config file with no rules
    const config = JSON.parse(readTestFile("rules-manager.json"));
    config.rules = {};
    fs.writeFileSync(
      path.join(testDir, "rules-manager.json"),
      JSON.stringify(config, null, 2),
    );

    // List rules when none have been added
    const { stdout, stderr, code } = await runCommand("list");

    // Command should run successfully
    expect(code).toBe(0);

    // Check the output message
    expect(stdout + stderr).toMatch(/no rules|empty|not found/i);
  });

  test("should format output correctly", async () => {
    // Initialize the config
    await runCommand("init");

    // Create a config file with a single rule
    const config = JSON.parse(readTestFile("rules-manager.json"));
    config.rules = {
      "test-rule": "./rules/test-rule.mdc",
    };
    fs.writeFileSync(
      path.join(testDir, "rules-manager.json"),
      JSON.stringify(config, null, 2),
    );

    // List the rules
    const { stdout, stderr, code } = await runCommand("list");

    // Command should run successfully
    expect(code).toBe(0);

    // Verify the output format is as expected
    expect(stdout).toContain("test-rule");
    expect(
      stdout
        .trim()
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0).length,
    ).toBeGreaterThanOrEqual(1);
  });

  test("should handle list command with additional arguments", async () => {
    // Initialize the config
    await runCommand("init");

    // Create a config file with a single rule
    const config = JSON.parse(readTestFile("rules-manager.json"));
    config.rules = {
      "test-rule-extra": "@company/rules/test-rule-extra.mdc",
    };
    fs.writeFileSync(
      path.join(testDir, "rules-manager.json"),
      JSON.stringify(config, null, 2),
    );

    // List the rules with an unrecognized flag (should be ignored)
    const { stdout, stderr, code } = await runCommand("list --unknown-flag");

    // Command should still run successfully
    expect(code).toBe(0);

    // Verify the rule is listed
    expect(stdout).toContain("test-rule-extra");
  });
});
