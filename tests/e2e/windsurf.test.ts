import path from "path";
import fs from "fs-extra";
import {
  setupFromFixture,
  runCommand,
  fileExists,
  readTestFile,
  testDir,
} from "./helpers";

describe("aicm windsurf integration", () => {
  test("should install rules to .rules directory and update .windsurfrules", async () => {
    await setupFromFixture("windsurf-basic", expect.getState().currentTestName);

    const { stdout, code } = await runCommand("install");

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    expect(fileExists(path.join(".rules", "always-rule.md"))).toBe(true);
    expect(fileExists(path.join(".rules", "opt-in-rule.md"))).toBe(true);
    expect(fileExists(path.join(".rules", "file-pattern-rule.md"))).toBe(true);

    const alwaysRuleContent = readTestFile(
      path.join(".rules", "always-rule.md"),
    );
    expect(alwaysRuleContent).toContain("Development Standards");

    const optInRuleContent = readTestFile(
      path.join(".rules", "opt-in-rule.md"),
    );
    expect(optInRuleContent).toContain("E2E Testing Best Practices");

    const filePatternRuleContent = readTestFile(
      path.join(".rules", "file-pattern-rule.md"),
    );
    expect(filePatternRuleContent).toContain("TypeScript Best Practices");

    expect(fileExists(".windsurfrules")).toBe(true);
    const windsurfRulesContent = readTestFile(".windsurfrules");

    expect(windsurfRulesContent).toContain("<!-- AICM:BEGIN -->");
    expect(windsurfRulesContent).toContain("<!-- AICM:END -->");

    expect(windsurfRulesContent).toContain(
      "[*.ts] .rules/file-pattern-rule.md",
    );
  });

  test("should update existing .windsurfrules file", async () => {
    await setupFromFixture(
      "windsurf-existing",
      expect.getState().currentTestName,
    );

    const { stdout, code } = await runCommand("install");

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    const windsurfRulesContent = readTestFile(".windsurfrules");

    expect(windsurfRulesContent).toContain("Manually written rules");
    expect(windsurfRulesContent).toContain("<rules>");
    expect(windsurfRulesContent).toContain("</rules>");

    expect(windsurfRulesContent).toContain("<!-- AICM:BEGIN -->");
    expect(windsurfRulesContent).toContain("<!-- AICM:END -->");
    expect(windsurfRulesContent).toContain(".rules/new-rule.md");
  });

  test("should install a single rule to windsurf", async () => {
    await setupFromFixture(
      "windsurf-single-rule",
      expect.getState().currentTestName,
    );

    const { stdout, code } = await runCommand(
      "install single-rule ./rules/local-rule.mdc",
    );

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    expect(fileExists(path.join(".rules", "single-rule.md"))).toBe(true);

    expect(fileExists(".windsurfrules")).toBe(true);
    const windsurfRulesContent = readTestFile(".windsurfrules");

    expect(windsurfRulesContent).toContain("<!-- AICM:BEGIN -->");
    expect(windsurfRulesContent).toContain("<!-- AICM:END -->");
    expect(windsurfRulesContent).toContain(".rules/single-rule.md");
  });

  test("should handle multiple rule types correctly", async () => {
    await setupFromFixture(
      "windsurf-multiple-types",
      expect.getState().currentTestName,
    );

    const { stdout, code } = await runCommand("install");

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    // Verify that all rule files were created
    expect(fileExists(path.join(".rules", "always-rule.md"))).toBe(true);
    expect(fileExists(path.join(".rules", "opt-in-rule.md"))).toBe(true);
    expect(fileExists(path.join(".rules", "file-pattern-rule.md"))).toBe(true);

    // Read the .windsurfrules file content
    const windsurfRulesContent = readTestFile(".windsurfrules");

    // Verify that all rules are included in the .windsurfrules file
    expect(windsurfRulesContent).toContain(".rules/always-rule.md");
    expect(windsurfRulesContent).toContain(".rules/opt-in-rule.md");
    expect(windsurfRulesContent).toContain(".rules/file-pattern-rule.md");

    // Verify that rules are categorized correctly
    expect(windsurfRulesContent).toContain(
      "The following rules always apply to all files in the project:",
    );
    expect(windsurfRulesContent).toContain(
      "The following rules are only included when explicitly referenced:",
    );

    // Check that specific rules are in the correct categories
    const alwaysSection = windsurfRulesContent.indexOf(
      "The following rules always apply to all files in the project:",
    );
    const manualSection = windsurfRulesContent.indexOf(
      "The following rules are only included when explicitly referenced:",
    );

    // Verify that always-rule.md is in the always section
    const alwaysRulePos = windsurfRulesContent.indexOf(".rules/always-rule.md");
    expect(alwaysRulePos).toBeGreaterThan(alwaysSection);
    expect(alwaysRulePos).toBeLessThan(manualSection);
  });

  test("should install multiple rules with a single command", async () => {
    // Setup test directory from fixture
    await setupFromFixture(
      "windsurf-multiple-command",
      expect.getState().currentTestName,
    );

    // Run install command to install both rules
    const { stdout, code } = await runCommand("install");

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    // Verify both rule files were created
    expect(fileExists(path.join(".rules", "first-rule.md"))).toBe(true);
    expect(fileExists(path.join(".rules", "second-rule.md"))).toBe(true);

    // Read the .windsurfrules file content
    const windsurfRulesContent = readTestFile(".windsurfrules");

    // Verify that both rules are included in the .windsurfrules file
    expect(windsurfRulesContent).toContain(".rules/first-rule.md");
    expect(windsurfRulesContent).toContain(".rules/second-rule.md");

    // Verify that rules are categorized correctly
    expect(windsurfRulesContent).toContain(
      "The following rules always apply to all files in the project:",
    );
    expect(windsurfRulesContent).toContain(
      "The following rules are available for the AI to include when needed:",
    );
  });

  test("should append markers to existing file without markers", async () => {
    await setupFromFixture("windsurf-no-markers");

    const testDirPath = testDir;

    fs.ensureDirSync(path.join(testDirPath, "rules"));
    const ruleContent = `---
description: "Rule for testing appending markers"
type: "always"
---

# No Marker Rule

This rule is used to test appending markers to an existing file without markers.`;
    fs.writeFileSync(
      path.join(testDirPath, "rules/no-marker-rule.mdc"),
      ruleContent,
    );

    const existingContent =
      "# Existing Windsurf Rules\n\nThese are some existing rules.";
    fs.writeFileSync(path.join(testDirPath, ".windsurfrules"), existingContent);

    const initialContent = fs.readFileSync(
      path.join(testDirPath, ".windsurfrules"),
      "utf8",
    );
    expect(initialContent).toBe(existingContent);

    const { stdout, code } = await runCommand(
      "install no-marker-rule ./rules/no-marker-rule.mdc --ide windsurf",
    );

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    const windsurfRulesContent = readTestFile(".windsurfrules");

    expect(windsurfRulesContent).toContain("# Existing Windsurf Rules");
    expect(windsurfRulesContent).toContain("These are some existing rules.");

    expect(windsurfRulesContent).toContain("<!-- AICM:BEGIN -->");
    expect(windsurfRulesContent).toContain("<!-- AICM:END -->");

    const beginMarkerIndex = windsurfRulesContent.indexOf(
      "<!-- AICM:BEGIN -->",
    );
    const existingContentIndex = windsurfRulesContent.indexOf(
      "# Existing Windsurf Rules",
    );
    expect(existingContentIndex).toBeLessThan(beginMarkerIndex);
  });
});
