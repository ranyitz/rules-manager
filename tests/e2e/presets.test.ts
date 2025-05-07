import path from "path";
import {
  setupFromFixture,
  runCommand,
  fileExists,
  readTestFile,
} from "./helpers";

describe("Presets with fixtures", () => {
  test("should install rules from a preset file", async () => {
    await setupFromFixture(
      "presets-from-file",
      expect.getState().currentTestName,
    );

    const { code } = await runCommand("install");

    expect(code).toBe(0);

    expect(
      fileExists(path.join(".cursor", "rules", "typescript-rule.mdc")),
    ).toBe(true);
    expect(fileExists(path.join(".cursor", "rules", "react-rule.mdc"))).toBe(
      true,
    );

    const typescriptRuleContent = readTestFile(
      path.join(".cursor", "rules", "typescript-rule.mdc"),
    );
    expect(typescriptRuleContent).toContain("TypeScript Best Practices");

    const reactRuleContent = readTestFile(
      path.join(".cursor", "rules", "react-rule.mdc"),
    );
    expect(reactRuleContent).toContain("React Best Practices");
  });

  test("should merge rules from presets with main configuration", async () => {
    await setupFromFixture("presets-merged", expect.getState().currentTestName);

    const { code } = await runCommand("install");

    expect(code).toBe(0);

    expect(fileExists(path.join(".cursor", "rules", "preset-rule.mdc"))).toBe(
      true,
    );
    expect(fileExists(path.join(".cursor", "rules", "local-rule.mdc"))).toBe(
      true,
    );

    const presetRuleContent = readTestFile(
      path.join(".cursor", "rules", "preset-rule.mdc"),
    );
    expect(presetRuleContent).toContain("Preset Rule");

    const localRuleContent = readTestFile(
      path.join(".cursor", "rules", "local-rule.mdc"),
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
    await setupFromFixture("presets-npm", expect.getState().currentTestName);

    const { code } = await runCommand("install");

    expect(code).toBe(0);

    expect(fileExists(path.join(".cursor", "rules", "npm-rule.mdc"))).toBe(
      true,
    );

    const npmRuleContent = readTestFile(
      path.join(".cursor", "rules", "npm-rule.mdc"),
    );
    expect(npmRuleContent).toContain("NPM Package Rule");
  });

  test("should handle errors with missing rule files", async () => {
    await setupFromFixture(
      "presets-missing-rules",
      expect.getState().currentTestName,
    );

    const { stderr, code } = await runCommand("install");

    expect(code).toBe(1);
    expect(stderr).toContain("Source file");
    expect(stderr).toContain("not found");
  });

  test("should handle errors with missing preset files", async () => {
    await setupFromFixture(
      "presets-missing-preset",
      expect.getState().currentTestName,
    );

    const { stderr, code } = await runCommand("install");

    expect(code).toBe(1);

    expect(stderr).toContain("Error loading preset");
  });
});
