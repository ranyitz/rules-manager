import path from "path";
import fs from "fs-extra";
import { rimraf } from "rimraf";
import {
  setupTestDir,
  readTestFile,
  fileExists,
  runCommand,
  testDir,
} from "./helpers";

/**
 * Write a file to the test directory
 */
function writeTestFile(filePath: string, content: string): void {
  const fullPath = path.join(testDir, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

describe("Presets", () => {
  beforeEach(async () => {
    await setupTestDir(expect.getState().currentTestName);
  });

  afterEach(async () => {
    await rimraf(testDir);
  });

  test("should install rules from a preset file", async () => {
    // Create a preset file with rules
    const presetContent = {
      rules: {
        "typescript-rule": "./rules/typescript.mdc",
        "react-rule": "./rules/react.mdc",
      },
    };

    // Create the rules directory and rule files
    fs.mkdirSync("./rules", { recursive: true });

    // Create the typescript rule file
    writeTestFile(
      path.join("rules", "typescript.mdc"),
      `# TypeScript Rule
name: TypeScript Best Practices
description: Rules for TypeScript development
alwaysApply: false
`
    );

    // Create the react rule file
    writeTestFile(
      path.join("rules", "react.mdc"),
      `# React Rule
name: React Best Practices
description: Rules for React development
alwaysApply: false
`
    );

    // Create the preset file
    writeTestFile(
      "company-preset.json",
      JSON.stringify(presetContent, null, 2)
    );

    // Create the main configuration file with a preset reference
    const config = {
      ides: ["cursor"],
      presets: ["./company-preset.json"],
    };

    writeTestFile("rules-manager.json", JSON.stringify(config, null, 2));

    // Run the install command
    const { stdout, stderr, code } = await runCommand("install");

    // Command should run successfully
    expect(code).toBe(0);

    // Check that rules from the preset were installed
    expect(
      fileExists(path.join(".cursor", "rules", "typescript-rule.mdc"))
    ).toBe(true);
    expect(fileExists(path.join(".cursor", "rules", "react-rule.mdc"))).toBe(
      true
    );

    // Check rule content
    const typescriptRuleContent = readTestFile(
      path.join(".cursor", "rules", "typescript-rule.mdc")
    );
    expect(typescriptRuleContent).toContain("TypeScript Best Practices");

    const reactRuleContent = readTestFile(
      path.join(".cursor", "rules", "react-rule.mdc")
    );
    expect(reactRuleContent).toContain("React Best Practices");
  });

  test("should merge rules from presets with main configuration", async () => {
    // Create a preset file with rules
    const presetContent = {
      rules: {
        "preset-rule": "./rules/preset-rule.mdc",
      },
    };

    // Create the rules directory and rule files
    fs.mkdirSync("./rules", { recursive: true });

    // Create the preset rule file
    writeTestFile(
      path.join("rules", "preset-rule.mdc"),
      `# Preset Rule
name: Preset Rule
description: Rule from a preset
alwaysApply: false
`
    );

    // Create a local rule file
    writeTestFile(
      path.join("rules", "local-rule.mdc"),
      `# Local Rule
name: Local Rule
description: Rule from local configuration
alwaysApply: false
`
    );

    // Create the preset file
    writeTestFile(
      "company-preset.json",
      JSON.stringify(presetContent, null, 2)
    );

    // Create the main configuration file with both a preset reference and local rules
    const config = {
      ides: ["cursor"],
      presets: ["./company-preset.json"],
      rules: {
        "local-rule": "./rules/local-rule.mdc",
      },
    };

    writeTestFile("rules-manager.json", JSON.stringify(config, null, 2));

    // Run the install command
    const { stdout, stderr, code } = await runCommand("install");

    // Command should run successfully
    expect(code).toBe(0);

    // Check that rules from both the preset and local config were installed
    expect(fileExists(path.join(".cursor", "rules", "preset-rule.mdc"))).toBe(
      true
    );
    expect(fileExists(path.join(".cursor", "rules", "local-rule.mdc"))).toBe(
      true
    );

    // Check rule content
    const presetRuleContent = readTestFile(
      path.join(".cursor", "rules", "preset-rule.mdc")
    );
    expect(presetRuleContent).toContain("Preset Rule");

    const localRuleContent = readTestFile(
      path.join(".cursor", "rules", "local-rule.mdc")
    );
    expect(localRuleContent).toContain("Local Rule");
  });

  test("should handle npm package presets", async () => {
    // Create .cursor/rules directory for installation
    fs.mkdirSync(path.join(testDir, ".cursor", "rules"), { recursive: true });

    // Mock an npm package preset by creating it in the test environment
    // In a real scenario, this would be an installed npm package
    const npmPresetDir = path.join(testDir, "node_modules", "@company");
    fs.mkdirSync(npmPresetDir, { recursive: true });

    // Create the rule file first
    const ruleContent = `# NPM Rule
name: NPM Package Rule
description: Rule from an npm package
alwaysApply: false
`;

    // Create the rules directory and rule file in our mock npm package
    const npmRulesDir = path.join(npmPresetDir, "rules");
    fs.mkdirSync(npmRulesDir, { recursive: true });
    fs.writeFileSync(path.join(npmRulesDir, "npm-rule.mdc"), ruleContent);

    // Create the preset file with relative path to the rule
    const presetContent = {
      rules: {
        "npm-rule": "./rules/npm-rule.mdc",
      },
    };

    // Write the preset file to the npm package directory
    fs.writeFileSync(
      path.join(npmPresetDir, "rules.json"),
      JSON.stringify(presetContent, null, 2)
    );

    // Create the main configuration file with an npm preset reference
    const config = {
      ides: ["cursor"],
      presets: ["@company/rules.json"],
    };

    writeTestFile("rules-manager.json", JSON.stringify(config, null, 2));

    // Run the install command
    const { stdout, stderr, code } = await runCommand("install");

    // Command should run successfully
    expect(code).toBe(0);

    // Check that rules from the npm preset were installed
    expect(fileExists(path.join(".cursor", "rules", "npm-rule.mdc"))).toBe(
      true
    );

    // Check rule content
    const npmRuleContent = readTestFile(
      path.join(".cursor", "rules", "npm-rule.mdc")
    );
    expect(npmRuleContent).toContain("NPM Package Rule");
  });

  test("should handle errors with missing preset files", async () => {
    // Create a configuration with a non-existent preset
    const config = {
      ides: ["cursor"],
      presets: ["./missing-preset.json"],
    };

    writeTestFile("rules-manager.json", JSON.stringify(config, null, 2));

    // Run the install command
    const { stdout, stderr, code } = await runCommand("install");

    // Command should complete but with warning about missing preset
    expect(code).toBe(0);
    expect(stdout).toContain("Error loading preset");
  });
});
