import path from "path";
import {
  setupFromFixture,
  runCommand,
  fileExists,
  readTestFile,
  testDir,
} from "./helpers";
import { getConfig } from "../../src/utils/config";

describe("Presets with fixtures", () => {
  test("should install rules from a preset file", async () => {
    await setupFromFixture("presets-from-file");

    const { code } = await runCommand("install --ci");

    expect(code).toBe(0);

    expect(
      fileExists(
        path.join(
          ".cursor",
          "rules",
          "aicm",
          "company-preset-full.json",
          "typescript-rule.mdc",
        ),
      ),
    ).toBe(true);
    expect(
      fileExists(
        path.join(
          ".cursor",
          "rules",
          "aicm",
          "company-preset-full.json",
          "react-rule.mdc",
        ),
      ),
    ).toBe(true);

    const typescriptRuleContent = readTestFile(
      path.join(
        ".cursor",
        "rules",
        "aicm",
        "company-preset-full.json",
        "typescript-rule.mdc",
      ),
    );
    expect(typescriptRuleContent).toContain("TypeScript Best Practices");

    const reactRuleContent = readTestFile(
      path.join(
        ".cursor",
        "rules",
        "aicm",
        "company-preset-full.json",
        "react-rule.mdc",
      ),
    );
    expect(reactRuleContent).toContain("React Best Practices");
  });

  test("should merge rules from presets with main configuration", async () => {
    await setupFromFixture("presets-merged");

    const { code } = await runCommand("install --ci");

    expect(code).toBe(0);

    expect(
      fileExists(
        path.join(
          ".cursor",
          "rules",
          "aicm",
          "company-preset.json",
          "preset-rule.mdc",
        ),
      ),
    ).toBe(true);
    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "local-rule.mdc")),
    ).toBe(true);

    const presetRuleContent = readTestFile(
      path.join(
        ".cursor",
        "rules",
        "aicm",
        "company-preset.json",
        "preset-rule.mdc",
      ),
    );
    expect(presetRuleContent).toContain("Preset Rule");

    const localRuleContent = readTestFile(
      path.join(".cursor", "rules", "aicm", "local-rule.mdc"),
    );
    expect(localRuleContent).toContain("Local Rule");

    const mcpPath = path.join(".cursor", "mcp.json");
    expect(fileExists(mcpPath)).toBe(true);
    const mcpConfig = JSON.parse(readTestFile(mcpPath));
    expect(mcpConfig).toHaveProperty("mcpServers");
    expect(mcpConfig.mcpServers["preset-mcp"]).toMatchObject({
      command: "./scripts/preset-mcp.sh",
      env: { MCP_TOKEN: "preset" },
    });
  });

  test("should handle npm package presets from @company/ai-rules", async () => {
    await setupFromFixture("presets-npm");

    const { code } = await runCommand("install --ci");

    expect(code).toBe(0);

    expect(
      fileExists(
        path.join(
          ".cursor",
          "rules",
          "aicm",
          "@company",
          "ai-rules",
          "npm-rule.mdc",
        ),
      ),
    ).toBe(true);

    const npmRuleContent = readTestFile(
      path.join(
        ".cursor",
        "rules",
        "aicm",
        "@company",
        "ai-rules",
        "npm-rule.mdc",
      ),
    );
    expect(npmRuleContent).toContain("NPM Package Rule");
  });

  test("should support shorthand npm directory preset loading (loads aicm.json from directory)", async () => {
    await setupFromFixture("presets-npm");

    const { code } = await runCommand("install --ci");

    expect(code).toBe(0);
    expect(
      fileExists(
        path.join(
          ".cursor",
          "rules",
          "aicm",
          "@company",
          "ai-rules",
          "npm-rule.mdc",
        ),
      ),
    ).toBe(true);
    const npmRuleContent = readTestFile(
      path.join(
        ".cursor",
        "rules",
        "aicm",
        "@company",
        "ai-rules",
        "npm-rule.mdc",
      ),
    );
    expect(npmRuleContent).toContain("NPM Package Rule");
  });

  test("should handle errors with missing rule files", async () => {
    await setupFromFixture("presets-missing-rules");

    const { stderr, code } = await runCommand("install --ci");

    expect(code).toBe(1);
    expect(stderr).toContain("Source file");
    expect(stderr).toContain("not found");
  });

  test("should handle errors with missing preset files", async () => {
    await setupFromFixture("presets-missing-preset");

    const { stderr, code } = await runCommand("install --ci");

    expect(code).toBe(1);

    expect(stderr).toContain("Error loading preset");
  });

  test("should override a rule and mcpServer from a preset", async () => {
    await setupFromFixture("presets-npm-override");

    const { code } = await runCommand("install --ci");
    expect(code).toBe(0);

    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "npm-rule.mdc")),
    ).toBe(true);
    const ruleContent = readTestFile(
      path.join(".cursor", "rules", "aicm", "npm-rule.mdc"),
    );
    expect(ruleContent).toContain("Override Rule");

    const mcpPath = path.join(".cursor", "mcp.json");
    expect(fileExists(mcpPath)).toBe(true);
    const mcpConfig = JSON.parse(readTestFile(mcpPath));
    expect(mcpConfig.mcpServers["preset-mcp"]).toMatchObject({
      command: "./scripts/override-mcp.sh",
      env: { MCP_TOKEN: "override" },
    });
  });

  test("should cancel a rule and mcpServer from a preset when set to false", async () => {
    await setupFromFixture("presets-cancel-rules");

    const { code } = await runCommand("install --ci");
    expect(code).toBe(0);

    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "npm-rule.mdc")),
    ).toBe(false);

    const mcpPath = path.join(".cursor", "mcp.json");
    expect(fileExists(mcpPath)).toBe(true);
    const mcpConfig = JSON.parse(readTestFile(mcpPath));
    expect(mcpConfig.mcpServers["preset-mcp"]).toBeUndefined();
  });

  test("should support namespaced directories for preset rules", async () => {
    await setupFromFixture("presets-namespaced-dirs");

    const { code } = await runCommand("install --ci");

    expect(code).toBe(0);

    const rootRulePath = path.join(
      ".cursor",
      "rules",
      "aicm",
      "@aicm",
      "test-preset",
      "root-rule.mdc",
    );
    const subdirRulePath = path.join(
      ".cursor",
      "rules",
      "aicm",
      "@aicm",
      "test-preset",
      "subdir",
      "subdir-rule.mdc",
    );

    expect(fileExists(rootRulePath)).toBe(true);
    expect(fileExists(subdirRulePath)).toBe(true);

    const rootRuleContent = readTestFile(rootRulePath);
    expect(rootRuleContent).toContain("Root Rule Content");

    const subdirRuleContent = readTestFile(subdirRulePath);
    expect(subdirRuleContent).toContain("Subdir Rule Content");
  });

  test("should recursively resolve nested presets", async () => {
    await setupFromFixture("presets-nested");

    const originalCwd = process.cwd();

    try {
      process.chdir(testDir);

      const config = getConfig();

      expect(config).not.toBeNull();

      expect(config!.rules).toHaveProperty(
        "topLevelRule",
        "rules/top-level-rule.js",
      );
      expect(config!.rules).toHaveProperty(
        "presetA-rule1",
        "rules/preset-a-rule1.js",
      );
      expect(config!.rules).toHaveProperty(
        "presetA-rule2",
        "rules/preset-a-rule2.js",
      );
      expect(config!.rules).toHaveProperty(
        "presetB-rule1",
        "rules/preset-b-rule1.js",
      );
      expect(config!.rules).toHaveProperty(
        "presetB-rule2",
        "rules/preset-b-rule2.js",
      );
      expect(config!.rules).toHaveProperty(
        "presetC-rule1",
        "rules/preset-c-rule1.js",
      );
      expect(config!.rules).toHaveProperty(
        "presetC-rule2",
        "rules/preset-c-rule2.js",
      );

      expect(Object.keys(config!.rules).length).toBe(7);
    } finally {
      process.chdir(originalCwd);
    }
  });

  test("should handle circular references between presets", async () => {
    await setupFromFixture("presets-circular");

    const originalCwd = process.cwd();

    try {
      process.chdir(testDir);

      const config = getConfig();

      expect(config).not.toBeNull();

      expect(config!.rules).toHaveProperty(
        "topLevelRule",
        "rules/top-level-rule.js",
      );
      expect(config!.rules).toHaveProperty(
        "circularA-rule",
        "rules/circular-a-rule.js",
      );
      expect(config!.rules).toHaveProperty(
        "circularB-rule",
        "rules/circular-b-rule.js",
      );
      expect(config!.rules).toHaveProperty(
        "circularC-rule",
        "rules/circular-c-rule.js",
      );

      expect(Object.keys(config!.rules).length).toBe(4);
    } finally {
      process.chdir(originalCwd);
    }
  });
});
