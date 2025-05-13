import path from "path";
import fs from "fs-extra";
import {
  setupFromFixture,
  runCommand,
  fileExists,
  readTestFile,
  testDir,
} from "./helpers";
import { parseMdcFile } from "../../src/utils/mdc-parser";

describe("aicm windsurf integration", () => {
  test("should install rules to .aicm directory and update .windsurfrules", async () => {
    await setupFromFixture("windsurf-basic", expect.getState().currentTestName);

    const { stdout, code } = await runCommand("install --ide windsurf");

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    expect(fileExists(path.join(".aicm", "always-rule.md"))).toBe(true);
    expect(fileExists(path.join(".aicm", "opt-in-rule.md"))).toBe(true);
    expect(fileExists(path.join(".aicm", "file-pattern-rule.md"))).toBe(true);

    const alwaysRuleContent = readTestFile(
      path.join(".aicm", "always-rule.md"),
    );
    expect(alwaysRuleContent).toContain("Development Standards");

    const optInRuleContent = readTestFile(path.join(".aicm", "opt-in-rule.md"));
    expect(optInRuleContent).toContain("E2E Testing Best Practices");

    const filePatternRuleContent = readTestFile(
      path.join(".aicm", "file-pattern-rule.md"),
    );
    expect(filePatternRuleContent).toContain("TypeScript Best Practices");

    expect(fileExists(".windsurfrules")).toBe(true);
    const windsurfRulesContent = readTestFile(".windsurfrules");

    expect(windsurfRulesContent).toContain("<!-- AICM:BEGIN -->");
    expect(windsurfRulesContent).toContain("<!-- AICM:END -->");

    expect(windsurfRulesContent).toContain("[*.ts] .aicm/file-pattern-rule.md");
  });

  test("should update existing .windsurfrules file", async () => {
    await setupFromFixture(
      "windsurf-existing",
      expect.getState().currentTestName,
    );

    const { stdout, code } = await runCommand("install --ide windsurf");

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    const windsurfRulesContent = readTestFile(".windsurfrules");

    expect(windsurfRulesContent).toContain("Manually written rules");
    expect(windsurfRulesContent).toContain("<rules>");
    expect(windsurfRulesContent).toContain("</rules>");

    expect(windsurfRulesContent).toContain("<!-- AICM:BEGIN -->");
    expect(windsurfRulesContent).toContain("<!-- AICM:END -->");
    expect(windsurfRulesContent).toContain(".aicm/new-rule.md");
  });

  test("should handle multiple rule types correctly", async () => {
    await setupFromFixture(
      "windsurf-multiple-types",
      expect.getState().currentTestName,
    );

    const { stdout, code } = await runCommand("install --ide windsurf");

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    expect(fileExists(path.join(".aicm", "always-rule.md"))).toBe(true);
    expect(fileExists(path.join(".aicm", "opt-in-rule.md"))).toBe(true);
    expect(fileExists(path.join(".aicm", "file-pattern-rule.md"))).toBe(true);

    const windsurfRulesContent = readTestFile(".windsurfrules");

    expect(windsurfRulesContent).toContain(".aicm/always-rule.md");
    expect(windsurfRulesContent).toContain(".aicm/opt-in-rule.md");
    expect(windsurfRulesContent).toContain(".aicm/file-pattern-rule.md");

    expect(windsurfRulesContent).toContain(
      "The following rules always apply to all files in the project:",
    );
    expect(windsurfRulesContent).toContain(
      "The following rules are only included when explicitly referenced:",
    );

    const alwaysSection = windsurfRulesContent.indexOf(
      "The following rules always apply to all files in the project:",
    );
    const manualSection = windsurfRulesContent.indexOf(
      "The following rules are only included when explicitly referenced:",
    );
    const alwaysRulePos = windsurfRulesContent.indexOf(".aicm/always-rule.md");
    expect(alwaysRulePos).toBeGreaterThan(alwaysSection);
    expect(alwaysRulePos).toBeLessThan(manualSection);
  });

  test("should install multiple rules with a single command", async () => {
    await setupFromFixture(
      "windsurf-multiple-command",
      expect.getState().currentTestName,
    );

    const { stdout, code } = await runCommand("install --ide windsurf");

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    expect(fileExists(path.join(".aicm", "first-rule.md"))).toBe(true);
    expect(fileExists(path.join(".aicm", "second-rule.md"))).toBe(true);

    const windsurfRulesContent = readTestFile(".windsurfrules");
    expect(windsurfRulesContent).toContain(".aicm/first-rule.md");
    expect(windsurfRulesContent).toContain(".aicm/second-rule.md");

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
    expect(windsurfRulesContent).toContain(".aicm/no-marker-rule.md");

    const beginMarkerIndex = windsurfRulesContent.indexOf(
      "<!-- AICM:BEGIN -->",
    );
    const existingContentIndex = windsurfRulesContent.indexOf(
      "# Existing Windsurf Rules",
    );
    expect(existingContentIndex).toBeLessThan(beginMarkerIndex);
  });

  test("should install rules into specified subdirectory when rule key includes a directory", async () => {
    await setupFromFixture(
      "windsurf-rule-in-subdir",
      expect.getState().currentTestName,
    );

    const { code } = await runCommand("install --ide windsurf");

    expect(code).toBe(0);

    expect(fileExists(path.join(".aicm", "dir", "general.md"))).toBe(true);

    const installedContent = readTestFile(
      path.join(".aicm", "dir", "general.md"),
    );
    const sourceFilePath = path.join("rules", "general.mdc");
    const { content: expectedContent } = parseMdcFile(
      path.join(testDir, sourceFilePath),
    );
    expect(installedContent).toBe(expectedContent);

    expect(fileExists(path.join(".aicm", "dir"))).toBe(true);
  });

  test("should install rules to .aicm directory and update .windsurfrules", async () => {
    await setupFromFixture("windsurf-basic", expect.getState().currentTestName);

    const { stdout, code } = await runCommand("install --ide windsurf");

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    expect(fileExists(path.join(".aicm", "always-rule.md"))).toBe(true);
    expect(fileExists(path.join(".aicm", "opt-in-rule.md"))).toBe(true);
    expect(fileExists(path.join(".aicm", "file-pattern-rule.md"))).toBe(true);

    const alwaysRuleContent = readTestFile(
      path.join(".aicm", "always-rule.md"),
    );
    expect(alwaysRuleContent).toContain("Development Standards");

    const optInRuleContent = readTestFile(path.join(".aicm", "opt-in-rule.md"));
    expect(optInRuleContent).toContain("E2E Testing Best Practices");

    const filePatternRuleContent = readTestFile(
      path.join(".aicm", "file-pattern-rule.md"),
    );
    expect(filePatternRuleContent).toContain("TypeScript Best Practices");

    expect(fileExists(".windsurfrules")).toBe(true);
    const windsurfRulesContent = readTestFile(".windsurfrules");

    expect(windsurfRulesContent).toContain("<!-- AICM:BEGIN -->");
    expect(windsurfRulesContent).toContain("<!-- AICM:END -->");

    expect(windsurfRulesContent).toContain("[*.ts] .aicm/file-pattern-rule.md");
  });

  test("should update existing .windsurfrules file", async () => {
    await setupFromFixture(
      "windsurf-existing",
      expect.getState().currentTestName,
    );

    const { stdout, code } = await runCommand("install --ide windsurf");

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    const windsurfRulesContent = readTestFile(".windsurfrules");

    expect(windsurfRulesContent).toContain("Manually written rules");
    expect(windsurfRulesContent).toContain("<rules>");
    expect(windsurfRulesContent).toContain("</rules>");

    expect(windsurfRulesContent).toContain("<!-- AICM:BEGIN -->");
    expect(windsurfRulesContent).toContain("<!-- AICM:END -->");
    expect(windsurfRulesContent).toContain(".aicm/new-rule.md");
  });

  test("should handle multiple rule types correctly", async () => {
    await setupFromFixture(
      "windsurf-multiple-types",
      expect.getState().currentTestName,
    );

    const { stdout, code } = await runCommand("install --ide windsurf");

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    expect(fileExists(path.join(".aicm", "always-rule.md"))).toBe(true);
    expect(fileExists(path.join(".aicm", "opt-in-rule.md"))).toBe(true);
    expect(fileExists(path.join(".aicm", "file-pattern-rule.md"))).toBe(true);

    const windsurfRulesContent = readTestFile(".windsurfrules");

    expect(windsurfRulesContent).toContain(".aicm/always-rule.md");
    expect(windsurfRulesContent).toContain(".aicm/opt-in-rule.md");
    expect(windsurfRulesContent).toContain(".aicm/file-pattern-rule.md");

    expect(windsurfRulesContent).toContain(
      "The following rules always apply to all files in the project:",
    );
    expect(windsurfRulesContent).toContain(
      "The following rules are only included when explicitly referenced:",
    );

    const alwaysSection = windsurfRulesContent.indexOf(
      "The following rules always apply to all files in the project:",
    );
    const manualSection = windsurfRulesContent.indexOf(
      "The following rules are only included when explicitly referenced:",
    );
    const alwaysRulePos = windsurfRulesContent.indexOf(".aicm/always-rule.md");
    expect(alwaysRulePos).toBeGreaterThan(alwaysSection);
    expect(alwaysRulePos).toBeLessThan(manualSection);
  });

  test("should install multiple rules with a single command", async () => {
    await setupFromFixture(
      "windsurf-multiple-command",
      expect.getState().currentTestName,
    );

    const { stdout, code } = await runCommand("install --ide windsurf");

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    expect(fileExists(path.join(".aicm", "first-rule.md"))).toBe(true);
    expect(fileExists(path.join(".aicm", "second-rule.md"))).toBe(true);

    const windsurfRulesContent = readTestFile(".windsurfrules");
    expect(windsurfRulesContent).toContain(".aicm/first-rule.md");
    expect(windsurfRulesContent).toContain(".aicm/second-rule.md");

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
    expect(windsurfRulesContent).toContain(".aicm/no-marker-rule.md");

    const beginMarkerIndex = windsurfRulesContent.indexOf(
      "<!-- AICM:BEGIN -->",
    );
    const existingContentIndex = windsurfRulesContent.indexOf(
      "# Existing Windsurf Rules",
    );
    expect(existingContentIndex).toBeLessThan(beginMarkerIndex);
  });

  test("should install rules into specified subdirectory when rule key includes a directory", async () => {
    await setupFromFixture(
      "windsurf-rule-in-subdir",
      expect.getState().currentTestName,
    );
    const { code } = await runCommand("install --ide windsurf");
    expect(code).toBe(0);

    expect(fileExists(path.join(".aicm", "dir", "general.md"))).toBe(true);
    const installedContent = readTestFile(
      path.join(".aicm", "dir", "general.md"),
    );
    const sourceFilePath = path.join("rules", "general.mdc");
    const { content: expectedContent } = parseMdcFile(
      path.join(testDir, sourceFilePath),
    );
    expect(installedContent).toBe(expectedContent);
    expect(fileExists(path.join(".aicm", "dir"))).toBe(true);
  });
});
