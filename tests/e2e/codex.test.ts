import path from "path";
import fs from "fs-extra";
import {
  setupFromFixture,
  runCommand,
  fileExists,
  readTestFile,
  testDir,
} from "./helpers";

describe("aicm codex integration", () => {
  test("should install rules and update AGENTS.md", async () => {
    await setupFromFixture("codex-basic");

    const { stdout } = await runCommand("install --ide codex --ci");
    expect(stdout).toContain("Rules installation completed");

    expect(fileExists(path.join(".aicm", "always-rule.md"))).toBe(true);
    expect(fileExists(path.join(".aicm", "opt-in-rule.md"))).toBe(true);
    expect(fileExists(path.join(".aicm", "file-pattern-rule.md"))).toBe(true);

    expect(fileExists("AGENTS.md")).toBe(true);
    const agentsContent = readTestFile("AGENTS.md");
    expect(agentsContent).toContain("<!-- AICM:BEGIN -->");
    expect(agentsContent).toContain("<!-- AICM:END -->");
    expect(agentsContent).toContain("[*.ts] .aicm/file-pattern-rule.md");
  });

  test("should append markers to existing file without markers", async () => {
    await setupFromFixture("codex-no-markers");

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
      "# Existing Codex Rules\n\nThese are some existing rules.";
    // AGENTS.md is created dynamically because Codex scans fixture paths
    // and would treat a static fixture file as a real config.
    fs.writeFileSync(path.join(testDirPath, "AGENTS.md"), existingContent);

    const { stdout } = await runCommand(
      "install no-marker-rule ./rules/no-marker-rule.mdc --ide codex --ci",
    );
    expect(stdout).toContain("Rules installation completed");

    const agentsContent = readTestFile("AGENTS.md");
    expect(agentsContent).toContain("# Existing Codex Rules");
    expect(agentsContent).toContain("These are some existing rules.");
    expect(agentsContent).toContain("<!-- AICM:BEGIN -->");
    expect(agentsContent).toContain("<!-- AICM:END -->");
    expect(agentsContent).toContain(".aicm/no-marker-rule.md");

    const beginMarkerIndex = agentsContent.indexOf("<!-- AICM:BEGIN -->");
    const existingContentIndex = agentsContent.indexOf(
      "# Existing Codex Rules",
    );
    expect(existingContentIndex).toBeLessThan(beginMarkerIndex);
  });
});
