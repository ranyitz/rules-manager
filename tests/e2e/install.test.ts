import path from "path";
import {
  setupFromFixture,
  runCommand,
  fileExists,
  readTestFile,
} from "./helpers";

describe("aicm install command with fixtures", () => {
  test("should show error when no rule is specified", async () => {
    await setupFromFixture("install-no-rules");

    const { stderr } = await runCommand("install --ci");

    expect(stderr).toContain("No rules defined in configuration");
  });

  test("should show error when config doesn't exist", async () => {
    await setupFromFixture("install-no-config");

    const { stderr, code } = await runCommand("install --ci");

    expect(code).toBe(1);
    expect(stderr).toMatch(/config|configuration|not found|init/i);
  });

  test("should install rules from config", async () => {
    await setupFromFixture("install-from-config");

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
      aicm: true,
    });
    expect(mcpConfig.mcpServers["remote-mcp"]).toMatchObject({
      env: { MCP_TOKEN: "test456" },
      aicm: true,
    });
  });

  test("should handle errors with missing rule files", async () => {
    await setupFromFixture("install-missing-rules");

    const { stderr, code } = await runCommand("install --ci");

    expect(code).toBe(1);
    expect(stderr).toContain("Error processing rule");
    expect(stderr).toContain("Source file");
    expect(stderr).toContain("does-not-exist.mdc not found");
  });

  test("should install rules into specified subdirectory when rule key includes a directory", async () => {
    await setupFromFixture("install-rule-in-subdir");

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
    await setupFromFixture("install-cursor-cleanup");

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
    await setupFromFixture("install-windsurf-cleanup");

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

  test("should preserve existing mcp configuration when installing new servers", async () => {
    await setupFromFixture("install-mcp-preserve-existing");

    const mcpPath = path.join(".cursor", "mcp.json");

    expect(fileExists(mcpPath)).toBe(true);
    const existingMcpConfig = JSON.parse(readTestFile(mcpPath));
    expect(existingMcpConfig.mcpServers["user-defined-server"]).toBeDefined();
    expect(existingMcpConfig.mcpServers["another-user-server"]).toBeDefined();

    const { code } = await runCommand("install --ci");

    expect(code).toBe(0);

    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "test-rule.mdc")),
    ).toBe(true);

    const finalMcpConfig = JSON.parse(readTestFile(mcpPath));

    expect(finalMcpConfig.mcpServers["user-defined-server"]).toMatchObject({
      command: "./user-scripts/user-server.sh",
      args: ["--user"],
      env: { USER_TOKEN: "user123" },
    });
    expect(finalMcpConfig.mcpServers["another-user-server"]).toMatchObject({
      env: { USER_API_KEY: "user456" },
    });

    expect(finalMcpConfig.mcpServers["aicm-managed-server"]).toMatchObject({
      command: "./scripts/aicm-server.sh",
      args: ["--aicm"],
      env: { AICM_TOKEN: "aicm123" },
      aicm: true,
    });
  });

  test("should override existing mcp servers with same key while preserving others", async () => {
    await setupFromFixture("install-mcp-override-same-key");

    const mcpPath = path.join(".cursor", "mcp.json");

    expect(fileExists(mcpPath)).toBe(true);
    const existingMcpConfig = JSON.parse(readTestFile(mcpPath));
    expect(existingMcpConfig.mcpServers["shared-server"]).toMatchObject({
      command: "./old-scripts/old-server.sh",
      args: ["--old"],
      env: { OLD_TOKEN: "old123" },
    });
    expect(existingMcpConfig.mcpServers["user-only-server"]).toBeDefined();
    expect(existingMcpConfig.userSettings).toMatchObject({
      editor: "vim",
      fontSize: 14,
    });

    const { code } = await runCommand("install --ci");

    expect(code).toBe(0);

    expect(
      fileExists(
        path.join(".cursor", "rules", "aicm", "override-test-rule.mdc"),
      ),
    ).toBe(true);

    const finalMcpConfig = JSON.parse(readTestFile(mcpPath));

    expect(finalMcpConfig.mcpServers["shared-server"]).toMatchObject({
      command: "./scripts/aicm-updated-server.sh",
      args: ["--aicm-updated"],
      env: { AICM_TOKEN: "aicm-new-token" },
      aicm: true,
    });

    expect(finalMcpConfig.mcpServers["aicm-only-server"]).toMatchObject({
      command: "./scripts/aicm-only.sh",
      env: { AICM_ONLY: "true" },
      aicm: true,
    });

    expect(finalMcpConfig.mcpServers["user-only-server"]).toMatchObject({
      env: { USER_ONLY_TOKEN: "useronly456" },
    });

    expect(finalMcpConfig.userSettings).toMatchObject({
      editor: "vim",
      fontSize: 14,
    });
  });

  test("should clean up stale aicm servers while preserving user servers", async () => {
    await setupFromFixture("install-mcp-stale-cleanup");

    const mcpPath = path.join(".cursor", "mcp.json");

    expect(fileExists(mcpPath)).toBe(true);
    const existingMcpConfig = JSON.parse(readTestFile(mcpPath));
    expect(existingMcpConfig.mcpServers["user-server"]).toBeDefined();
    expect(existingMcpConfig.mcpServers["existing-aicm-server"]).toMatchObject({
      aicm: true,
    });
    expect(existingMcpConfig.mcpServers["stale-aicm-server"]).toMatchObject({
      aicm: true,
    });
    expect(existingMcpConfig.userSettings).toMatchObject({
      preference: "keep-this",
    });

    const { code } = await runCommand("install --ci");

    expect(code).toBe(0);

    expect(
      fileExists(
        path.join(".cursor", "rules", "aicm", "cleanup-test-rule.mdc"),
      ),
    ).toBe(true);

    const finalMcpConfig = JSON.parse(readTestFile(mcpPath));

    expect(finalMcpConfig.mcpServers["user-server"]).toMatchObject({
      command: "./user-scripts/user-server.sh",
      env: { USER_TOKEN: "user789" },
    });
    expect(finalMcpConfig.mcpServers["user-server"].aicm).toBeUndefined();

    expect(finalMcpConfig.mcpServers["existing-aicm-server"]).toMatchObject({
      command: "./scripts/updated-existing-server.sh",
      args: ["--updated"],
      env: { UPDATED_TOKEN: "updated456" },
      aicm: true,
    });

    expect(finalMcpConfig.mcpServers["new-aicm-server"]).toMatchObject({
      command: "./scripts/new-aicm-server.sh",
      args: ["--new"],
      env: { NEW_TOKEN: "new123" },
      aicm: true,
    });

    expect(finalMcpConfig.mcpServers["stale-aicm-server"]).toBeUndefined();

    expect(finalMcpConfig.userSettings).toMatchObject({
      preference: "keep-this",
    });
  });

  test("should handle canceled mcp servers correctly", async () => {
    await setupFromFixture("install-mcp-canceled-servers");

    const mcpPath = path.join(".cursor", "mcp.json");

    expect(fileExists(mcpPath)).toBe(true);
    const existingMcpConfig = JSON.parse(readTestFile(mcpPath));
    expect(existingMcpConfig.mcpServers["user-server"]).toBeDefined();
    expect(existingMcpConfig.mcpServers["canceled-server"]).toMatchObject({
      aicm: true,
    });
    expect(existingMcpConfig.userConfig).toMatchObject({
      setting: "preserve-this",
    });

    const { code } = await runCommand("install --ci");

    expect(code).toBe(0);

    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "cancel-test-rule.mdc")),
    ).toBe(true);

    const finalMcpConfig = JSON.parse(readTestFile(mcpPath));

    expect(finalMcpConfig.mcpServers["user-server"]).toMatchObject({
      command: "./user-scripts/user-server.sh",
      env: { USER_TOKEN: "user123" },
    });

    expect(finalMcpConfig.mcpServers["active-server"]).toMatchObject({
      command: "./scripts/active-server.sh",
      env: { ACTIVE_TOKEN: "active123" },
      aicm: true,
    });

    expect(finalMcpConfig.mcpServers["canceled-server"]).toBeUndefined();

    expect(finalMcpConfig.userConfig).toMatchObject({
      setting: "preserve-this",
    });
  });
});

describe("aicm install with glob patterns in aicm.json", () => {
  test("should install rules from basic glob pattern", async () => {
    await setupFromFixture("install-glob-basic");
    const { code, stderr } = await runCommand("install --ci");

    expect(stderr).toBe("");
    expect(code).toBe(0);

    const explicitRulePath = path.join(
      ".cursor",
      "rules",
      "aicm",
      "explicit-main-rule.mdc",
    );
    expect(fileExists(explicitRulePath)).toBe(true);
    expect(readTestFile(explicitRulePath)).toContain("Explicit Main Rule");

    const globRule1Path = path.join(
      ".cursor",
      "rules",
      "aicm",
      "glob-rule1.mdc",
    );
    expect(fileExists(globRule1Path)).toBe(true);
    expect(readTestFile(globRule1Path)).toContain("Glob Rule 1");

    const globRule2Path = path.join(
      ".cursor",
      "rules",
      "aicm",
      "glob-rule2.mdc",
    );
    expect(fileExists(globRule2Path)).toBe(true);
    expect(readTestFile(globRule2Path)).toContain("Glob Rule 2");

    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "rule-group")),
    ).toBe(false);
    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "rule-group.mdc")),
    ).toBe(false);
  });

  test("should handle empty glob pattern with no matches", async () => {
    await setupFromFixture("install-glob-empty");
    const { code, stderr } = await runCommand("install --ci");

    expect(stderr).toBe("");
    expect(code).toBe(0);

    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "no-match-group.mdc")),
    ).toBe(false);
    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "no-match-group")),
    ).toBe(false);
  });

  test("should handle glob conflicts and cancellations correctly", async () => {
    await setupFromFixture("install-glob-conflict");
    // Warnings about conflicts are expected, so we don't check stderr for emptiness here.
    // We could capture and check stderr for specific warnings if the test framework supports it easily.
    const { code } = await runCommand("install --ci");
    expect(code).toBe(0); // Command should still succeed even with conflicts (which are warned)

    const explicitGlobRule1Path = path.join(
      ".cursor",
      "rules",
      "aicm",
      "glob-rule1.mdc",
    );
    expect(fileExists(explicitGlobRule1Path)).toBe(true);
    expect(readTestFile(explicitGlobRule1Path)).toContain(
      "Explicit glob-rule1",
    );

    const cancelledGlobRule2Path = path.join(
      ".cursor",
      "rules",
      "aicm",
      "glob-rule2.mdc",
    );
    expect(fileExists(cancelledGlobRule2Path)).toBe(false);

    const globRule3Path = path.join(
      ".cursor",
      "rules",
      "aicm",
      "glob-rule3.mdc",
    );
    expect(fileExists(globRule3Path)).toBe(true);
    expect(readTestFile(globRule3Path)).toContain("From Glob glob-rule3");

    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "another-group")),
    ).toBe(false);
    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "another-group.mdc")),
    ).toBe(false);
  });
});
