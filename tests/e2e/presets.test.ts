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
      aicm: true,
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
      aicm: true,
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

describe("aicm install with glob patterns in presets", () => {
  test("should install rules from glob pattern within a preset", async () => {
    await setupFromFixture("presets-glob-basic");
    const { code, stderr } = await runCommand("install --ci");

    expect(stderr).toBe(""); // Expect no errors for basic glob resolution
    expect(code).toBe(0);

    // Check main config rule
    const mainRulePath = path.join(".cursor", "rules", "aicm", "main-rule.mdc");
    expect(fileExists(mainRulePath)).toBe(true);
    expect(readTestFile(mainRulePath)).toContain("Main Config Rule");

    // Check preset's explicit rule (namespaced)
    const presetExplicitRulePath = path.join(
      ".cursor",
      "rules",
      "aicm",
      "my-preset.json",
      "preset-explicit.mdc",
    );
    expect(fileExists(presetExplicitRulePath)).toBe(true);
    expect(readTestFile(presetExplicitRulePath)).toContain(
      "Preset Explicit Rule",
    );

    // Check preset's glob-generated rules (namespaced)
    const presetGlobRule1Path = path.join(
      ".cursor",
      "rules",
      "aicm",
      "my-preset.json",
      "preset-glob1.mdc",
    );
    expect(fileExists(presetGlobRule1Path)).toBe(true);
    expect(readTestFile(presetGlobRule1Path)).toContain("Preset Glob Rule 1");

    const presetGlobRule2Path = path.join(
      ".cursor",
      "rules",
      "aicm",
      "my-preset.json",
      "preset-glob2.mdc",
    );
    expect(fileExists(presetGlobRule2Path)).toBe(true);
    expect(readTestFile(presetGlobRule2Path)).toContain("Preset Glob Rule 2");

    // Assert that the glob key itself from the preset is not treated as a rule/directory
    expect(
      fileExists(
        path.join(
          ".cursor",
          "rules",
          "aicm",
          "my-preset.json",
          "generated-rules",
        ),
      ),
    ).toBe(false);
    expect(
      fileExists(
        path.join(
          ".cursor",
          "rules",
          "aicm",
          "my-preset.json",
          "generated-rules.mdc",
        ),
      ),
    ).toBe(false);
  });

  test("should handle preset glob conflicts, overrides, and cancellations by main config", async () => {
    await setupFromFixture("presets-glob-conflict");
    const { code } = await runCommand("install --ci"); // stderr removed

    // Warnings about conflicts might appear in stderr or stdout.
    // For now, focusing on the final file state and successful execution.
    expect(code).toBe(0);

    // preset-glob1: Overridden by main config (not namespaced)
    const overriddenPg1Path = path.join(
      ".cursor",
      "rules",
      "aicm",
      "preset-glob1.mdc",
    );
    expect(fileExists(overriddenPg1Path)).toBe(true);
    expect(readTestFile(overriddenPg1Path)).toContain("Overridden PG1");
    // Ensure the namespaced version from preset (which would be from glob) is NOT present
    const namespacedOriginalPg1Path = path.join(
      ".cursor",
      "rules",
      "aicm",
      "conflicting-preset.json",
      "preset-glob1.mdc",
    );
    expect(fileExists(namespacedOriginalPg1Path)).toBe(false);

    // preset-glob2: Cancelled by main config
    const cancelledPg2Path = path.join(
      ".cursor",
      "rules",
      "aicm",
      "conflicting-preset.json",
      "preset-glob2.mdc",
    );
    const unCancelledPg2Path = path.join(
      ".cursor",
      "rules",
      "aicm",
      "preset-glob2.mdc",
    );
    expect(fileExists(cancelledPg2Path)).toBe(false); // Should not exist namespaced
    expect(fileExists(unCancelledPg2Path)).toBe(false); // Should not exist un-namespaced either

    // preset-glob3: Should be installed from preset glob (namespaced)
    const presetGlob3Path = path.join(
      ".cursor",
      "rules",
      "aicm",
      "conflicting-preset.json",
      "preset-glob3.mdc",
    );
    expect(fileExists(presetGlob3Path)).toBe(true);
    expect(readTestFile(presetGlob3Path)).toContain("Preset Original PG3");

    // explicit-in-preset: Should be installed from preset (namespaced)
    const explicitInPresetPath = path.join(
      ".cursor",
      "rules",
      "aicm",
      "conflicting-preset.json",
      "explicit-in-preset.mdc",
    );
    expect(fileExists(explicitInPresetPath)).toBe(true);
    expect(readTestFile(explicitInPresetPath)).toContain("Preset Explicit EP");

    // extra1.mdc (from another-glob-group): Should be installed from preset glob (namespaced)
    const extra1Path = path.join(
      ".cursor",
      "rules",
      "aicm",
      "conflicting-preset.json",
      "extra1.mdc",
    );
    expect(fileExists(extra1Path)).toBe(true);
    expect(readTestFile(extra1Path)).toContain("Preset Extra Glob 1");

    // Assert that glob keys from preset are not treated as rules/directories
    expect(
      fileExists(
        path.join(
          ".cursor",
          "rules",
          "aicm",
          "conflicting-preset.json",
          "another-glob-group",
        ),
      ),
    ).toBe(false);
  });
});
