import path from "path";
import {
  setupFromFixture,
  runCommand,
  fileExists,
  readTestFile,
} from "./helpers";

describe("rules-manager install command with fixtures", () => {
  test("should show error when no rule is specified", async () => {
    await setupFromFixture(
      "install-no-rules",
      expect.getState().currentTestName,
    );

    const { stdout } = await runCommand("install");

    expect(stdout).toContain("No rules defined in configuration");
  });

  test("should show error when config doesn't exist", async () => {
    await setupFromFixture(
      "install-no-config",
      expect.getState().currentTestName,
    );

    const { stdout } = await runCommand("install test-rule");

    expect(stdout).toMatch(/config|configuration|initialize|init/i);
  });

  test("should install a rule", async () => {
    await setupFromFixture(
      "install-single-rule",
      expect.getState().currentTestName,
    );

    const { stdout } = await runCommand(
      "install test-rule ./rules/local-rule.mdc",
    );

    expect(stdout).toContain("Rules installation completed");
  });

  test("should install rules from config", async () => {
    await setupFromFixture(
      "install-from-config",
      expect.getState().currentTestName,
    );

    const { code } = await runCommand("install");

    expect(code).toBe(0);

    expect(fileExists(path.join(".cursor", "rules", "local-rule.mdc"))).toBe(
      true,
    );

    const localRuleContent = readTestFile(
      path.join(".cursor", "rules", "local-rule.mdc"),
    );
    expect(localRuleContent).toContain("alwaysApply: false");
  });

  test("should handle errors with missing rule files", async () => {
    await setupFromFixture(
      "install-missing-rules",
      expect.getState().currentTestName,
    );

    const { stderr, code } = await runCommand("install");

    expect(code).toBe(1);
    expect(stderr).toContain("Error during rule installation");
    expect(stderr).toContain("Source file");
    expect(stderr).toContain("does-not-exist.mdc not found");
  });

  test("should install a rule with a local path using simplified syntax", async () => {
    await setupFromFixture(
      "install-simplified-syntax",
      expect.getState().currentTestName,
    );

    const { stdout, code } = await runCommand(
      "install local-rule ./rules/local-rule.mdc",
    );

    expect(code).toBe(0);
    expect(stdout).toContain("Configuration updated successfully");

    expect(fileExists(path.join(".cursor", "rules", "local-rule.mdc"))).toBe(
      true,
    );

    const config = JSON.parse(readTestFile("rules.json"));
    expect(config.rules["local-rule"]).toBe("./rules/local-rule.mdc");
  });

  test("should create config if it doesn't exist when installing with simplified syntax", async () => {
    await setupFromFixture(
      "install-no-config-simplified",
      expect.getState().currentTestName,
    );

    const { stdout, code } = await runCommand(
      "install new-rule ./rules/local-rule.mdc",
    );

    expect(code).toBe(0);
    expect(stdout).toContain(
      "Configuration file not found. Creating a new one",
    );
    expect(stdout).toContain("Configuration updated successfully");

    expect(fileExists("rules.json")).toBe(true);

    const config = JSON.parse(readTestFile("rules.json"));
    expect(config.rules["new-rule"]).toBe("./rules/local-rule.mdc");

    expect(fileExists(path.join(".cursor", "rules", "new-rule.mdc"))).toBe(
      true,
    );
  });

  test("should throw error when trying to install from URL", async () => {
    await setupFromFixture(
      "install-url-rule",
      expect.getState().currentTestName,
    );

    const { stderr, code } = await runCommand(
      "install url-rule https://example.com/rule.mdc",
    );

    expect(code).toBe(1);
    expect(stderr).toContain("Error during rule installation");
    expect(stderr).toContain(
      "URL-based rules are not supported due to security concerns",
    );
  });
});
