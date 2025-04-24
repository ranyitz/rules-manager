import path from "path";
import fs from "fs-extra";
import { setupTestDir, runCommand, testDir, readTestFile } from "./helpers";

describe("ai-rules list command", () => {
  // Get the current filename for our directory structure
  const testFilename = path.basename(__filename);

  beforeEach(async () => {
    // Don't setup test directories here since we'll do it per test
  });

  test("should list all rules in the config", async () => {
    // Setup a dedicated test directory
    await setupTestDir(testFilename, "list-all-rules");

    // Initialize the config
    await runCommand("init");

    // Create a config file with multiple rules manually
    const config = JSON.parse(readTestFile("ai-rules.json"));
    config.rules = {
      rule1: { source: "https://example.com/rule1.mdc", type: "url" },
      rule2: { source: "https://example.com/rule2.mdc", type: "url" },
      rule3: { source: "https://example.com/rule3.mdc", type: "url" },
    };
    fs.writeFileSync(
      path.join(testDir, "ai-rules.json"),
      JSON.stringify(config, null, 2)
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
    // Setup a dedicated test directory
    await setupTestDir(testFilename, "no-rules-exist");

    // Initialize the config
    await runCommand("init");

    // Create a config file with no rules
    const config = JSON.parse(readTestFile("ai-rules.json"));
    config.rules = {};
    fs.writeFileSync(
      path.join(testDir, "ai-rules.json"),
      JSON.stringify(config, null, 2)
    );

    // List rules when none have been added
    const { stdout, stderr, code } = await runCommand("list");

    // Command should run successfully
    expect(code).toBe(0);

    // Check the output message
    expect(stdout + stderr).toMatch(/no rules|empty|not found/i);
  });

  test("should format output correctly", async () => {
    // Setup a dedicated test directory
    await setupTestDir(testFilename, "format-output");

    // Initialize the config
    await runCommand("init");

    // Create a config file with a single rule
    const config = JSON.parse(readTestFile("ai-rules.json"));
    config.rules = {
      "test-rule": { source: "https://example.com/test-rule.mdc", type: "url" },
    };
    fs.writeFileSync(
      path.join(testDir, "ai-rules.json"),
      JSON.stringify(config, null, 2)
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
        .filter((line) => line.trim().length > 0).length
    ).toBeGreaterThanOrEqual(1);
  });

  test("should handle list command with additional arguments", async () => {
    // Setup a dedicated test directory
    await setupTestDir(testFilename, "additional-args");

    // Initialize the config
    await runCommand("init");

    // Create a config file with a single rule
    const config = JSON.parse(readTestFile("ai-rules.json"));
    config.rules = {
      "test-rule-extra": {
        source: "https://example.com/test-rule-extra.mdc",
        type: "url",
      },
    };
    fs.writeFileSync(
      path.join(testDir, "ai-rules.json"),
      JSON.stringify(config, null, 2)
    );

    // List the rules with an extra flag (which might be ignored)
    const { stdout, stderr, code } = await runCommand("list --verbose");

    // Command should still run successfully
    expect(code).toBe(0);

    // Verify the rule is listed
    expect(stdout).toContain("test-rule-extra");
  });
});
