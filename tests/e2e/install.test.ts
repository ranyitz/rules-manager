import path from "path";
import {
  setupFromFixture,
  runCommand,
  fileExists,
  readTestFile,
  testDir,
} from "./helpers";

describe("rules-manager install command with fixtures", () => {
  test("should show error when no rule is specified", async () => {
    // Setup the test directory using a dedicated fixture
    await setupFromFixture(
      "install-no-rules",
      expect.getState().currentTestName,
    );

    // Initialize a config first
    await runCommand("init");

    // Run the install command without arguments
    const { stdout, stderr } = await runCommand("install");

    // Should show message about no rules defined
    expect(stdout).toContain("No rules defined in configuration");
  });

  test("should show error when config doesn't exist", async () => {
    // Setup the test directory using a dedicated fixture
    await setupFromFixture(
      "install-no-config",
      expect.getState().currentTestName,
    );

    // Run install without first creating a config
    const { stdout, stderr } = await runCommand("install test-rule");

    // Should mention config file or initialization
    expect(stdout).toMatch(/config|configuration|initialize|init/i);
  });

  test("should install a rule", async () => {
    // Setup the test directory using a dedicated fixture
    await setupFromFixture(
      "install-single-rule",
      expect.getState().currentTestName,
    );

    // Initialize a config first
    await runCommand("init");

    // Install a rule using new simplified syntax (no --local flag)
    const { stdout, stderr } = await runCommand(
      "install test-rule ./rules/local-rule.mdc",
    );

    // Check if the rule file was created
    expect(stdout).toContain("Rule installation complete");
  });

  test("should install rules from config", async () => {
    // Setup the test directory using a dedicated fixture with pre-configured rules-manager.json
    await setupFromFixture(
      "install-from-config",
      expect.getState().currentTestName,
    );

    // Run the install command
    const { stdout, stderr, code } = await runCommand("install");

    // Command should run successfully
    expect(code).toBe(0);

    // Check that rules were installed for Cursor in the project directory
    expect(fileExists(path.join(".cursor", "rules", "local-rule.mdc"))).toBe(
      true,
    );

    // Check rule content for Cursor
    const localRuleContent = readTestFile(
      path.join(".cursor", "rules", "local-rule.mdc"),
    );
    expect(localRuleContent).toContain("alwaysApply: false");
  });

  test("should handle errors with missing rule files", async () => {
    // Setup the test directory using a dedicated fixture with missing rule files
    await setupFromFixture(
      "install-missing-rules",
      expect.getState().currentTestName,
    );

    // Run the install command
    const { stdout, stderr, code } = await runCommand("install");

    // Command should still succeed but log errors
    expect(code).toBe(0);
    expect(stdout).toContain("Error: Source file");
    expect(stdout).toContain("does-not-exist.mdc not found");
  });

  test("should install a rule with a local path using simplified syntax", async () => {
    // Setup the test directory using a dedicated fixture
    await setupFromFixture(
      "install-simplified-syntax",
      expect.getState().currentTestName,
    );

    // Install a rule with simplified syntax (no --local flag)
    const { stdout, stderr, code } = await runCommand(
      "install local-rule ./rules/local-rule.mdc",
    );

    // Command should run successfully
    expect(code).toBe(0);
    expect(stdout).toContain("Configuration updated successfully");

    // Check the rule was installed
    expect(fileExists(path.join(".cursor", "rules", "local-rule.mdc"))).toBe(
      true,
    );

    // Verify the config file was updated
    const config = JSON.parse(readTestFile("rules-manager.json"));
    expect(config.rules["local-rule"]).toBe("./rules/local-rule.mdc");
  });

  test("should create config if it doesn't exist when installing with simplified syntax", async () => {
    // Setup the test directory using a dedicated fixture without config file
    await setupFromFixture(
      "install-no-config-simplified",
      expect.getState().currentTestName,
    );

    // Install a rule with simplified syntax
    const { stdout, stderr, code } = await runCommand(
      "install new-rule ./rules/local-rule.mdc",
    );

    // Command should run successfully
    expect(code).toBe(0);
    expect(stdout).toContain(
      "Configuration file not found. Creating a new one",
    );
    expect(stdout).toContain("Configuration updated successfully");

    // Verify the config file was created
    expect(fileExists("rules-manager.json")).toBe(true);

    // Verify the config file contains the correct rule
    const config = JSON.parse(readTestFile("rules-manager.json"));
    expect(config.rules["new-rule"]).toBe("./rules/local-rule.mdc");

    // Check the rule was installed
    expect(fileExists(path.join(".cursor", "rules", "new-rule.mdc"))).toBe(
      true,
    );
  });

  test("should throw error when trying to install from URL", async () => {
    // Setup the test directory using a dedicated fixture
    await setupFromFixture(
      "install-url-rule",
      expect.getState().currentTestName,
    );

    // Attempt to install a rule from URL
    const { stdout, stderr, code } = await runCommand(
      "install url-rule https://example.com/rule.mdc",
    );

    // We expect the error message to be present in stderr
    expect(stderr).toContain("Error during rule installation");
    expect(stderr).toContain(
      "URL-based rules are not supported due to security concerns",
    );
  });
});
