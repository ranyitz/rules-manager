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

    // Assert .cursor/mcp.json exists and contains the preset-mcp
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

    // The overridden rule should be installed
    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "npm-rule.mdc")),
    ).toBe(true);
    const ruleContent = readTestFile(
      path.join(".cursor", "rules", "aicm", "npm-rule.mdc"),
    );
    expect(ruleContent).toContain("Override Rule");

    // The overridden mcpServer should be present in mcp.json
    const mcpPath = path.join(".cursor", "mcp.json");
    expect(fileExists(mcpPath)).toBe(true);
    const mcpConfig = JSON.parse(readTestFile(mcpPath));
    expect(mcpConfig.mcpServers["preset-mcp"]).toMatchObject({
      command: "./scripts/override-mcp.sh",
      env: { MCP_TOKEN: "override" },
    });
  });

  test("should cancel a rule and mcpServer from a preset when set to false", async () => {
    // Use a fixture with pre-canceled rules and mcpServers
    await setupFromFixture("presets-cancel-rules");

    const { code } = await runCommand("install --ci");
    expect(code).toBe(0);

    // The canceled rule should not be installed
    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "npm-rule.mdc")),
    ).toBe(false);

    // The canceled mcpServer should not be present in mcp.json
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

    // Check the content
    const rootRuleContent = readTestFile(rootRulePath);
    expect(rootRuleContent).toContain("Root Rule Content");

    const subdirRuleContent = readTestFile(subdirRulePath);
    expect(subdirRuleContent).toContain("Subdir Rule Content");
  });

  test("should recursively resolve nested presets", async () => {
    await setupFromFixture("presets-nested");

    // Store original working directory
    const originalCwd = process.cwd();

    try {
      // Change to test directory to load config directly
      process.chdir(testDir);

      // Get the config with nested presets
      const config = getConfig();

      // Verify that all the rules from nested presets are resolved correctly
      expect(config).not.toBeNull();

      // Check proper rule resolution from different levels
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

      // Verify the correct number of rules (1 from top level + 2 from each preset)
      expect(Object.keys(config!.rules).length).toBe(7);
    } finally {
      // Restore original working directory
      process.chdir(originalCwd);
    }
  });

  test("should handle circular references between presets", async () => {
    await setupFromFixture("presets-circular");

    // Store original working directory
    const originalCwd = process.cwd();

    try {
      // Change to test directory to load config directly
      process.chdir(testDir);

      // Get the config with circular references
      const config = getConfig();

      // Verify all rules are correctly resolved despite circular references
      expect(config).not.toBeNull();

      // Use non-null assertion since we've verified config is not null
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

      // Verify the correct number of rules (1 from top level + 1 from each preset)
      expect(Object.keys(config!.rules).length).toBe(4);
    } finally {
      // Restore original working directory
      process.chdir(originalCwd);
    }
  });
});
