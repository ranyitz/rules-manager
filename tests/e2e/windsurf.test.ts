import path from "path";
import fs from "fs-extra";
import {
  setupFromFixture,
  runCommand,
  fileExists,
  readTestFile,
  testDir,
} from "./helpers";

describe("rules-manager windsurf integration", () => {
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

    expect(windsurfRulesContent).toContain("<!-- RULES-MANAGER:BEGIN -->");
    expect(windsurfRulesContent).toContain("<!-- RULES-MANAGER:END -->");

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

    expect(windsurfRulesContent).toContain("<!-- RULES-MANAGER:BEGIN -->");
    expect(windsurfRulesContent).toContain("<!-- RULES-MANAGER:END -->");
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

    expect(windsurfRulesContent).toContain("<!-- RULES-MANAGER:BEGIN -->");
    expect(windsurfRulesContent).toContain("<!-- RULES-MANAGER:END -->");
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

    const windsurfRulesContent = readTestFile(".windsurfrules");
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

    expect(windsurfRulesContent).toContain("<!-- RULES-MANAGER:BEGIN -->");
    expect(windsurfRulesContent).toContain("<!-- RULES-MANAGER:END -->");

    const beginMarkerIndex = windsurfRulesContent.indexOf(
      "<!-- RULES-MANAGER:BEGIN -->",
    );
    const existingContentIndex = windsurfRulesContent.indexOf(
      "# Existing Windsurf Rules",
    );
    expect(existingContentIndex).toBeLessThan(beginMarkerIndex);
  });
});
