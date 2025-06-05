import path from "path";
import { setupFromFixture, setupTestDir, testDir } from "./helpers";
import { install, NormalizedConfig } from "../../src/api";
import fs from "fs-extra";

describe("aicm Node.js API", () => {
  const originalCI = process.env.CI;

  beforeAll(() => {
    process.env.CI = "false";
  });

  afterAll(() => {
    process.env.CI = originalCI;
  });

  test("should install rules using the API with default options", async () => {
    await setupFromFixture("install-from-config");

    const result = await install({
      cwd: testDir,
    });

    expect(result.success).toBe(true);
    expect(result.installedRuleCount).toBe(1);
    const rulesDir = path.join(testDir, ".cursor", "rules", "aicm");
    expect(fs.existsSync(rulesDir)).toBe(true);
    expect(fs.readdirSync(rulesDir)).toEqual(["local-rule.mdc"]);
  });

  test("should install rules using the API with custom config", async () => {
    await setupFromFixture("api-test-custom-config");

    const rulePath = path.join(testDir, "rules", "test-rule.mdc");
    expect(fs.existsSync(rulePath)).toBe(true);

    const config: NormalizedConfig = {
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
    expect(ruleContent).toContain("alwaysApply: false");
    expect(ruleContent).toContain("Sample rule content");
  });

  test("should use cursor as default IDE when ides field is not specified", async () => {
    await setupFromFixture("api-test-default-ide");

    const result = await install({
      cwd: testDir,
    });

    expect(result.success).toBe(true);
    expect(result.installedRuleCount).toBe(1);

    const cursorInstallPath = path.join(
      testDir,
      ".cursor",
      "rules",
      "aicm",
      "default-ide-rule.mdc",
    );
    expect(fs.existsSync(cursorInstallPath)).toBe(true);

    const ruleContent = fs.readFileSync(cursorInstallPath, "utf8");
    expect(ruleContent).toContain("Default IDE Test Rule");
    expect(ruleContent).toContain("Sample rule content");
  });

  test("should handle config with no rules correctly", async () => {
    await setupTestDir();

    const config: NormalizedConfig = {
      ides: ["cursor"],
      rules: {},
    };

    const result = await install({
      config,
      cwd: testDir,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No rules defined");
    expect(result.installedRuleCount).toBe(0);
  });

  test("should handle custom working directory", async () => {
    await setupFromFixture("install-from-config");

    const subDir = path.join(testDir, "subdir");
    fs.mkdirSync(subDir, { recursive: true });

    const customConfig: NormalizedConfig = {
      ides: ["cursor"],
      rules: {
        "custom-dir-rule": path.resolve(testDir, "rules", "local-rule.mdc"), // Use absolute path
      },
    };

    const result = await install({
      cwd: subDir,
      config: customConfig,
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
