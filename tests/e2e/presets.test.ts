import path from "path";
import * as fs from "fs";
import { testDir } from "./helpers";
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

  test("should override a rule and mcpServer from a preset", async () => {
    await setupFromFixture(
      "presets-npm-override",
      expect.getState().currentTestName,
    );

    const { code } = await runCommand("install");
    expect(code).toBe(0);

    // The overridden rule should be installed
    expect(fileExists(path.join(".cursor", "rules", "npm-rule.mdc"))).toBe(
      true,
    );
    const ruleContent = readTestFile(
      path.join(".cursor", "rules", "npm-rule.mdc"),
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
    // Setup fixture, then modify aicm.json to cancel rule and mcpServer
    await setupFromFixture(
      "presets-npm-override",
      expect.getState().currentTestName,
    );
    const configPath = path.join(testDir, "aicm.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    config.rules["npm-rule"] = false;
    config.mcpServers["preset-mcp"] = false;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const { code } = await runCommand("install");
    expect(code).toBe(0);

    // The canceled rule should not be installed
    expect(fileExists(path.join(".cursor", "rules", "npm-rule.mdc"))).toBe(
      false,
    );

    // The canceled mcpServer should not be present in mcp.json
    const mcpPath = path.join(".cursor", "mcp.json");
    expect(fileExists(mcpPath)).toBe(true);
    const mcpConfig = JSON.parse(readTestFile(mcpPath));
    expect(mcpConfig.mcpServers["preset-mcp"]).toBeUndefined();
  });
});
