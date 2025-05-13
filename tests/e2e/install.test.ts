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

    const { stdout } = await runCommand("install");

    expect(stdout).toContain("No rules defined in configuration");
  });

  test("should show error when config doesn't exist", async () => {
    await setupFromFixture(
      "install-no-config",
      expect.getState().currentTestName,
    );

    const { stderr, code } = await runCommand("install");

    expect(code).toBe(1);
    expect(stderr).toMatch(/config|configuration|not found|init/i);
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

    // Assert .cursor/mcp.json exists and contains both mcps
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
      url: "https://example.com/mcp-config.json",
      env: { MCP_TOKEN: "test456" },
    });
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

  test("should install rules into specified subdirectory when rule key includes a directory", async () => {
    await setupFromFixture(
      "install-rule-in-subdir",
      expect.getState().currentTestName,
    );

    const { code } = await runCommand("install");

    expect(code).toBe(0);

    // Check that the rule file is installed in the subdirectory
    expect(
      fileExists(path.join(".cursor", "rules", "dir", "general.mdc")),
    ).toBe(true);

    // Check that the content matches
    const installedContent = readTestFile(
      path.join(".cursor", "rules", "dir", "general.mdc"),
    );
    const sourceContent = readTestFile(path.join("rules", "general.mdc"));
    expect(installedContent).toBe(sourceContent);

    // Check that the directory exists
    expect(fileExists(path.join(".cursor", "rules", "dir"))).toBe(true);
  });
});
