import path from "path";
import { setupFromFixture, setupTestDir, testDir } from "./helpers";
import { install, Config } from "../../src/api";
import fs from "fs-extra";

describe("aicm Node.js API", () => {
  test("should install rules using the API with default options", async () => {
    await setupFromFixture(
      "install-from-config",
      expect.getState().currentTestName,
    );

    const result = await install({
      silent: false,
      cwd: testDir,
    });

    expect(result.success).toBe(true);
    expect(result.installedRuleCount).toBe(1);
    const rulesDir = path.join(testDir, ".cursor", "rules", "aicm");
    expect(fs.existsSync(rulesDir)).toBe(true);
    expect(fs.readdirSync(rulesDir)).toEqual(["local-rule.mdc"]);
  });

  test("should install rules using the API with custom config", async () => {
    await setupTestDir(expect.getState().currentTestName);

    const rulesDir = path.join(testDir, "rules");
    fs.mkdirSync(rulesDir, { recursive: true });

    const rulePath = path.join(rulesDir, "test-rule.mdc");
    fs.writeFileSync(
      rulePath,
      `name: Test Rule
description: A test rule created programmatically
alwaysApply: true

# This is a test rule created via the API test
`,
    );

    expect(fs.existsSync(rulePath)).toBe(true);

    const config: Config = {
      ides: ["cursor"],
      rules: {
        "test-rule": path.resolve(testDir, "rules", "test-rule.mdc"), // Use absolute path
      },
      mcpServers: {
        "api-test-server": {
          url: "https://example.com/api-test",
          env: { API_KEY: "test-key" },
        },
      },
    };

    const result = await install({
      config,
      cwd: testDir,
      silent: true,
    });

    expect(result.success).toBe(true);
    expect(result.installedRuleCount).toBe(1);

    const installPath = path.join(
      testDir,
      ".cursor",
      "rules",
      "aicm",
      "test-rule.mdc",
    );
    expect(fs.existsSync(installPath)).toBe(true);

    const ruleContent = fs.readFileSync(installPath, "utf8");
    expect(ruleContent).toContain("alwaysApply: true");
    expect(ruleContent).toContain(
      "This is a test rule created via the API test",
    );
  });

  test("should handle config with no rules correctly", async () => {
    await setupTestDir(expect.getState().currentTestName);

    const config: Config = {
      ides: ["cursor"],
      rules: {},
    };

    const result = await install({
      config,
      cwd: testDir,
      silent: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No rules defined");
    expect(result.installedRuleCount).toBe(0);
  });

  test("should handle custom working directory", async () => {
    await setupFromFixture(
      "install-from-config",
      expect.getState().currentTestName,
    );

    const subDir = path.join(testDir, "subdir");
    fs.mkdirSync(subDir, { recursive: true });

    const customConfig: Config = {
      ides: ["cursor"],
      rules: {
        "custom-dir-rule": path.resolve(testDir, "rules", "local-rule.mdc"), // Use absolute path
      },
    };

    const result = await install({
      cwd: subDir,
      config: customConfig,
      silent: true,
    });

    expect(result.success).toBe(true);
    expect(result.installedRuleCount).toBe(1);

    expect(
      fs.existsSync(
        path.join(subDir, ".cursor", "rules", "aicm", "custom-dir-rule.mdc"),
      ),
    ).toBe(true);
  });
});
