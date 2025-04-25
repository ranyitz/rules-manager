import fs from "fs-extra";
import path from "path";
import nock from "nock";
import os from "os";
import {
  setupTestDir,
  runCommand,
  copyFixture,
  fileExists,
  readTestFile,
  projectRoot,
  testDir,
  getDirectoryStructure,
} from "./helpers";

// Mock home directory for tests
const originalHomedir = os.homedir;
const mockHomeDir = path.join(testDir, "mock-home");

describe("rules-manager install command", () => {
  beforeEach(async () => {
    // Setup a clean test directory for each test with proper scoping
    await setupTestDir("install.test.ts", expect.getState().currentTestName);

    // Create mock project-specific directories for IDEs
    fs.mkdirSync(path.join(testDir, ".cursor/rules"), { recursive: true });

    // Mock os.homedir to return our test home directory
    Object.defineProperty(os, "homedir", {
      value: jest.fn(() => mockHomeDir),
      configurable: true,
    });

    // Create a rules directory for local sources
    fs.mkdirSync(path.join(testDir, "rules"), { recursive: true });

    // Copy example rule to rules directory
    copyFixture("example-rule.mdc", "rules/local-rule.mdc");

    // Setup HTTP mock for URL sources
    nock.disableNetConnect();
    nock("https://example.com")
      .get("/rule.mdc")
      .reply(200, "# Example Rule\nThis is a test rule from URL.")
      .get("/rules/formatting.mdc")
      .reply(200, "# Formatting Rule\nThis is a test rule for formatting.");
  });

  afterEach(() => {
    // Restore os.homedir
    Object.defineProperty(os, "homedir", {
      value: originalHomedir,
      configurable: true,
    });

    // Clean up nock
    nock.cleanAll();
    nock.enableNetConnect();
  });

  test("should show error when no rule is specified", async () => {
    // Initialize a config first
    await runCommand("init");

    // Run the install command without arguments
    const { stdout, stderr } = await runCommand("install");

    // Should show message about no rules defined
    expect(stdout).toContain("No rules defined in configuration");
  });

  test("should show error when config doesn't exist", async () => {
    // Run install without first creating a config
    const { stdout, stderr } = await runCommand("install test-rule");

    // Should mention config file or initialization
    expect(stdout).toMatch(/config|configuration|initialize|init/i);
  });

  test("should install a rule", async () => {
    // Initialize a config first
    await runCommand("init");

    // Create a rule to reference
    copyFixture("example-rule.mdc", "rules/test-rule.mdc");

    // Install a rule using new simplified syntax (no --local flag)
    const { stdout, stderr } = await runCommand(
      "install test-rule ./rules/test-rule.mdc"
    );

    // Check if the rule file was created
    expect(stdout).toContain("Rule installation complete");
  });

  test("should install rules from config", async () => {
    // Create a custom config with a local rule
    const installConfig = {
      ides: ["cursor"],
      rules: {
        "local-rule": "./rules/local-rule.mdc",
      },
    };
    fs.writeJsonSync(path.join(testDir, "rules-manager.json"), installConfig);

    // Run the install command
    const { stdout, stderr, code } = await runCommand("install");

    // Command should run successfully
    expect(code).toBe(0);
    expect(stdout).toContain("Installing rules");

    // Check that rules were installed for Cursor in the project directory
    expect(fileExists(path.join(".cursor", "rules", "local-rule.mdc"))).toBe(
      true
    );

    // Check rule content for Cursor
    const localRuleContent = readTestFile(
      path.join(".cursor", "rules", "local-rule.mdc")
    );
    expect(localRuleContent).toContain("alwaysApply: false");
  });

  test("should handle errors with missing rule files", async () => {
    // Create a config with a non-existent local rule
    const badConfig = {
      ides: ["cursor"],
      rules: {
        "missing-rule": "./rules/does-not-exist.mdc",
      },
    };
    fs.writeJsonSync(path.join(testDir, "rules-manager.json"), badConfig);

    // Run the install command
    const { stdout, stderr, code } = await runCommand("install");

    // Command should still succeed but log errors
    expect(code).toBe(0);
    expect(stdout).toContain("Error: Source file");
    expect(stdout).toContain("does-not-exist.mdc not found");
  });

  test("should install a rule with a local path using simplified syntax", async () => {
    // Create a rule to reference
    copyFixture("example-rule.mdc", "rules/test-rule.mdc");

    // Install a rule with simplified syntax (no --local flag)
    const { stdout, stderr, code } = await runCommand(
      "install local-rule ./rules/test-rule.mdc"
    );

    // Command should run successfully
    expect(code).toBe(0);
    expect(stdout).toContain(
      "Installing rule local-rule from ./rules/test-rule.mdc"
    );
    expect(stdout).toContain("Configuration updated successfully");

    // Check the rule was installed
    expect(fileExists(path.join(".cursor", "rules", "local-rule.mdc"))).toBe(
      true
    );

    // Verify the config file was updated
    const config = JSON.parse(readTestFile("rules-manager.json"));
    expect(config.rules["local-rule"]).toBe("./rules/test-rule.mdc");
  });

  test("should install a rule from URL using simplified syntax", async () => {
    // Install a rule with simplified syntax (no --url flag)
    const { stdout, stderr, code } = await runCommand(
      "install url-rule https://example.com/rule.mdc"
    );

    // Command should run successfully
    expect(code).toBe(0);
    expect(stdout).toContain(
      "Installing rule url-rule from https://example.com/rule.mdc"
    );
    expect(stdout).toContain("Configuration updated successfully");

    // Check the rule was installed
    expect(fileExists(path.join(".cursor", "rules", "url-rule.mdc"))).toBe(
      true
    );

    // Verify the config file was updated
    const config = JSON.parse(readTestFile("rules-manager.json"));
    expect(config.rules["url-rule"]).toBe("https://example.com/rule.mdc");
  });

  test("should create config if it doesn't exist when installing with simplified syntax", async () => {
    // Remove any config file if it exists
    if (fileExists("rules-manager.json")) {
      fs.removeSync(path.join(testDir, "rules-manager.json"));
    }

    // Install a rule with simplified syntax
    const { stdout, stderr, code } = await runCommand(
      "install new-rule https://example.com/rules/formatting.mdc"
    );

    // Command should run successfully
    expect(code).toBe(0);
    expect(stdout).toContain(
      "Configuration file not found. Creating a new one"
    );
    expect(stdout).toContain("Configuration updated successfully");

    // Verify the config file was created
    expect(fileExists("rules-manager.json")).toBe(true);

    // Verify the config file contains the correct rule
    const config = JSON.parse(readTestFile("rules-manager.json"));
    expect(config.rules["new-rule"]).toBe(
      "https://example.com/rules/formatting.mdc"
    );

    // Check the rule was installed
    expect(fileExists(path.join(".cursor", "rules", "new-rule.mdc"))).toBe(
      true
    );
  });
});
