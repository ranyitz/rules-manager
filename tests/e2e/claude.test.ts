import path from "path";
import {
  setupFromFixture,
  runCommand,
  fileExists,
  readTestFile,
  writeTestFile,
} from "./helpers";

describe("claude integration", () => {
  test("should install rules and update CLAUDE.md", async () => {
    await setupFromFixture("claude-basic");

    const { stdout, code } = await runCommand("install --ci");

    expect(code).toBe(0);
    expect(stdout).toContain("Successfully installed 4 rules");

    // Check that rules were installed
    expect(fileExists(path.join(".aicm", "always-rule.md"))).toBe(true);
    expect(fileExists(path.join(".aicm", "opt-in-rule.md"))).toBe(true);
    expect(fileExists(path.join(".aicm", "file-pattern-rule.md"))).toBe(true);
    expect(fileExists(path.join(".aicm", "manual-rule.md"))).toBe(true);

    // Check that CLAUDE.md was created/updated
    expect(fileExists("CLAUDE.md")).toBe(true);
    const claudeContent = readTestFile("CLAUDE.md");
    expect(claudeContent).toContain("<!-- AICM:BEGIN -->");
    expect(claudeContent).toContain("<!-- AICM:END -->");
    expect(claudeContent).toContain(
      "The following rules always apply to all files in the project:",
    );
    expect(claudeContent).toContain(
      "The following rules can be loaded when relevant. Check each file's description:",
    );
    expect(claudeContent).toContain(
      "The following rules are only included when explicitly referenced:",
    );
    expect(claudeContent).toContain("- .aicm/always-rule.md");
    expect(claudeContent).toContain("- [*.ts] .aicm/file-pattern-rule.md");
    expect(claudeContent).toContain("- .aicm/opt-in-rule.md");
    expect(claudeContent).toContain("- .aicm/manual-rule.md");
  });

  test("should append markers to existing file without markers", async () => {
    await setupFromFixture("claude-no-markers");

    // Create existing CLAUDE.md file without markers
    const existingContent =
      "# Existing Claude Rules\n\nThese are some existing rules.";
    writeTestFile("CLAUDE.md", existingContent);

    const { stdout, code } = await runCommand("install --ci");

    expect(code).toBe(0);
    expect(stdout).toContain("Successfully installed 1 rule");

    // Check that rule was installed
    expect(fileExists(path.join(".aicm", "no-marker-rule.md"))).toBe(true);

    // Check that CLAUDE.md was updated with markers
    const claudeContent = readTestFile("CLAUDE.md");
    expect(claudeContent).toContain("# Existing Claude Rules");
    expect(claudeContent).toContain("These are some existing rules.");
    expect(claudeContent).toContain("<!-- AICM:BEGIN -->");
    expect(claudeContent).toContain("<!-- AICM:END -->");
    expect(claudeContent).toContain(
      "The following rules are only included when explicitly referenced:",
    );
    expect(claudeContent).toContain("- .aicm/no-marker-rule.md");

    // Verify that existing content comes before AICM markers
    const beginMarkerIndex = claudeContent.indexOf("<!-- AICM:BEGIN -->");
    const existingContentIndex = claudeContent.indexOf(
      "# Existing Claude Rules",
    );
    expect(existingContentIndex).toBeLessThan(beginMarkerIndex);
  });
});
