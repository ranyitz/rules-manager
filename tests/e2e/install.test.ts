import path from "path";
import {
  setupFromFixture,
  runCommand,
  fileExists,
  readTestFile,
} from "./helpers";

describe("aicm install command with fixtures", () => {
  test("should show error when no rule is specified", async () => {
    await setupFromFixture(
      "install-no-rules",
      expect.getState().currentTestName,
    );

    const { stderr } = await runCommand("install --ci");

    expect(stderr).toContain("No rules defined in configuration");
  });

  test("should show error when config doesn't exist", async () => {
    await setupFromFixture(
      "install-no-config",
      expect.getState().currentTestName,
    );

    const { stderr, code } = await runCommand("install --ci");

    expect(code).toBe(1);
    expect(stderr).toMatch(/config|configuration|not found|init/i);
  });

  test("should install rules from config", async () => {
    await setupFromFixture(
      "install-from-config",
      expect.getState().currentTestName,
    );

    const { code } = await runCommand("install --ci");

    expect(code).toBe(0);

    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "local-rule.mdc")),
    ).toBe(true);

    const localRuleContent = readTestFile(
      path.join(".cursor", "rules", "aicm", "local-rule.mdc"),
    );
    expect(localRuleContent).toContain("alwaysApply: false");

    const mcpPath = path.join(".cursor", "mcp.json");
    expect(fileExists(mcpPath)).toBe(true);
    const mcpConfig = JSON.parse(readTestFile(mcpPath));
    expect(mcpConfig).toHaveProperty("mcpServers");
    expect(mcpConfig.mcpServers["local-mcp"]).toMatchObject({
      command: "./scripts/start-mcp.sh",
      args: ["--test"],
      env: { MCP_TOKEN: "test123" },
    });
    expect(mcpConfig.mcpServers["remote-mcp"]).toMatchObject({
      env: { MCP_TOKEN: "test456" },
    });
  });

  test("should handle errors with missing rule files", async () => {
    await setupFromFixture(
      "install-missing-rules",
      expect.getState().currentTestName,
    );

    const { stderr, code } = await runCommand("install --ci");

    expect(code).toBe(1);
    expect(stderr).toContain("Error processing rule");
    expect(stderr).toContain("Source file");
    expect(stderr).toContain("does-not-exist.mdc not found");
  });

  test("should install rules into specified subdirectory when rule key includes a directory", async () => {
    await setupFromFixture(
      "install-rule-in-subdir",
      expect.getState().currentTestName,
    );

    const { code } = await runCommand("install --ci");

    expect(code).toBe(0);

    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "dir", "general.mdc")),
    ).toBe(true);

    const installedContent = readTestFile(
      path.join(".cursor", "rules", "aicm", "dir", "general.mdc"),
    );
    const sourceContent = readTestFile(path.join("rules", "general.mdc"));
    expect(installedContent).toBe(sourceContent);

    expect(fileExists(path.join(".cursor", "rules", "aicm", "dir"))).toBe(true);
  });

  test("should clean stale Cursor rules on installation", async () => {
    await setupFromFixture(
      "install-cursor-cleanup",
      expect.getState().currentTestName,
    );

    const staleRulePath = path.join(
      ".cursor",
      "rules",
      "aicm",
      "stale-rule.mdc",
    );
    const newRulePath = path.join(".cursor", "rules", "aicm", "new-rule.mdc");
    const anotherStaleRulePath = path.join(
      ".cursor",
      "rules",
      "aicm",
      "another-stale-rule.mdc",
    );

    const { code, stdout } = await runCommand("install --ci");

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    expect(fileExists(staleRulePath)).toBe(false);
    expect(fileExists(anotherStaleRulePath)).toBe(false);
    expect(fileExists(newRulePath)).toBe(true);
  });

  test("should clean stale Windsurf rules and .aicm directory before installation", async () => {
    await setupFromFixture(
      "install-windsurf-cleanup",
      expect.getState().currentTestName,
    );

    expect(fileExists(path.join(".aicm", "stale-windsurf-rule.md"))).toBe(true);
    const oldFreshContent = readTestFile(
      path.join(".aicm", "fresh-windsurf-rule.md"),
    );
    expect(oldFreshContent).toContain("This is OLD fresh Windsurf content");
    let windsurfRulesContent = readTestFile(".windsurfrules");
    expect(windsurfRulesContent).toContain(".aicm/stale-windsurf-rule.md");
    expect(windsurfRulesContent).toContain(".aicm/another-stale-reference.md");

    const { code, stdout } = await runCommand("install --ci --ide windsurf");

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    expect(fileExists(path.join(".aicm", "stale-windsurf-rule.md"))).toBe(
      false,
    );

    expect(fileExists(path.join(".aicm", "fresh-windsurf-rule.md"))).toBe(true);
    const freshRuleContent = readTestFile(
      path.join(".aicm", "fresh-windsurf-rule.md"),
    );
    expect(freshRuleContent).toContain("This is fresh Windsurf content.");
    expect(freshRuleContent).not.toContain(
      "This is OLD fresh Windsurf content",
    );

    windsurfRulesContent = readTestFile(".windsurfrules");
    expect(windsurfRulesContent).not.toContain(".aicm/stale-windsurf-rule.md");
    expect(windsurfRulesContent).not.toContain(
      ".aicm/another-stale-reference.md",
    );
    expect(windsurfRulesContent).toContain(".aicm/fresh-windsurf-rule.md");
  });
});
