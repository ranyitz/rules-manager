import path from "path";
import fs from "fs-extra";
import { install } from "../../src/api_v2";
import { setupFromFixture, cleanup } from "./helpers";

describe("aicm v2 API", () => {
  let testDir: string;

  afterEach(() => {
    // Restore original working directory
    process.chdir(path.join(__dirname, "../.."));
    cleanup(testDir);
  });

  test("should install rules using v2 API", async () => {
    testDir = await setupFromFixture("install-v2-basic");

    const result = await install({
      cwd: testDir,
      installOnCI: true,
    });

    expect(result.success).toBe(true);
    expect(result.installedRuleCount).toBe(1);
    expect(result.packagesCount).toBe(1);

    // Check that rule was installed
    const ruleFile = path.join(
      testDir,
      ".cursor",
      "rules",
      "aicm",
      "test-rule-v2.mdc",
    );
    expect(fs.existsSync(ruleFile)).toBe(true);

    const ruleContent = fs.readFileSync(ruleFile, "utf8");
    expect(ruleContent).toContain("Test Rule V2");
    expect(ruleContent).toContain("v2 configuration format using rulesDir");

    // Check that MCP config was installed
    const mcpFile = path.join(testDir, ".cursor", "mcp.json");
    expect(fs.existsSync(mcpFile)).toBe(true);

    const mcpConfig = fs.readJsonSync(mcpFile);
    expect(mcpConfig.mcpServers["test-mcp-v2"]).toMatchObject({
      command: "./scripts/test-mcp-v2.sh",
      args: ["--test"],
      env: { TEST_TOKEN: "test123" },
      aicm: true,
    });
  });

  test("should handle missing config gracefully via API", async () => {
    testDir = await setupFromFixture("no-config");

    const result = await install({
      cwd: testDir,
      installOnCI: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe("Configuration file not found");
    expect(result.installedRuleCount).toBe(0);
    expect(result.packagesCount).toBe(0);
  });
});
