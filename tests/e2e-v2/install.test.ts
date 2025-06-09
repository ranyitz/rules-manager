import path from "path";
import {
  setupFromFixture,
  runCommand,
  runFailedCommand,
  fileExists,
  readTestFile,
  cleanup,
} from "./helpers";

describe("aicm v2 install command", () => {
  let testDir: string;

  afterEach(() => {
    // Restore original working directory
    process.chdir(path.join(__dirname, "../.."));
    cleanup(testDir);
  });

  test("should install rules using v2 config format", async () => {
    testDir = await setupFromFixture("install-v2-basic");

    const { stdout, code } = await runCommand("install --ci", testDir);

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    // Check that rule was installed
    expect(
      fileExists(
        path.join(".cursor", "rules", "aicm", "test-rule-v2.mdc"),
        testDir,
      ),
    ).toBe(true);

    const ruleContent = readTestFile(
      path.join(".cursor", "rules", "aicm", "test-rule-v2.mdc"),
      testDir,
    );
    expect(ruleContent).toContain("Test Rule V2");
    expect(ruleContent).toContain("v2 configuration format using rulesDir");

    // Check that MCP config was installed
    const mcpPath = path.join(".cursor", "mcp.json");
    expect(fileExists(mcpPath, testDir)).toBe(true);

    const mcpConfig = JSON.parse(readTestFile(mcpPath, testDir));
    expect(mcpConfig).toHaveProperty("mcpServers");
    expect(mcpConfig.mcpServers["test-mcp-v2"]).toMatchObject({
      command: "./scripts/test-mcp-v2.sh",
      args: ["--test"],
      env: { TEST_TOKEN: "test123" },
      aicm: true,
    });
  });

  test("should show error when no config file exists", async () => {
    testDir = await setupFromFixture("no-config-v2");

    const { stderr, code } = await runFailedCommand("install --ci", testDir);

    expect(code).not.toBe(0);
    expect(stderr).toMatch(/config|configuration|not found/i);
  });

  test("should show help when no command is provided", async () => {
    testDir = await setupFromFixture("install-v2-basic");

    const { stdout, code } = await runCommand("--help", testDir);

    expect(code).toBe(0);
    expect(stdout).toContain("aicm v2");
    expect(stdout).toContain(
      "CLI tool for managing AI IDE configurations (v2)",
    );
    expect(stdout).toContain("install");
    expect(stdout).toContain("aicm-v2");
  });

  test("should show version", async () => {
    testDir = await setupFromFixture("install-v2-basic");

    const { stdout, code } = await runCommand("--version", testDir);

    expect(code).toBe(0);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/); // Should match version pattern
  });
});
