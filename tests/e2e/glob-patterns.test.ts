import {
  setupFromFixture,
  runCommand,
  fileExists,
  readTestFile,
} from "./helpers";
import path from "node:path";
import fs from "fs-extra";

describe("aicm glob patterns", () => {
  it("should expand glob patterns and install rules with correct namespacing", async () => {
    await setupFromFixture("install-glob-basic");

    const { stdout, code } = await runCommand("install --verbose");

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    // Check that verbose output shows pattern expansion
    expect(stdout).toContain(
      'Pattern "./rules/typescript/*.mdc" → typescript/interfaces',
    );
    expect(stdout).toContain(
      'Pattern "./rules/typescript/*.mdc" → typescript/strict',
    );
    expect(stdout).toContain('Pattern "./rules/testing/*.mdc" → testing/e2e');
    expect(stdout).toContain('Pattern "./rules/testing/*.mdc" → testing/unit');

    // Verify all rules were installed with correct namespacing
    expect(
      fileExists(
        path.join(".cursor", "rules", "aicm", "typescript", "interfaces.mdc"),
      ),
    ).toBe(true);
    expect(
      fileExists(
        path.join(".cursor", "rules", "aicm", "typescript", "strict.mdc"),
      ),
    ).toBe(true);
    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "testing", "e2e.mdc")),
    ).toBe(true);
    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "testing", "unit.mdc")),
    ).toBe(true);
    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "explicit-rule.mdc")),
    ).toBe(true);

    // Verify rule content is correct
    const typescriptStrictContent = readTestFile(
      path.join(".cursor", "rules", "aicm", "typescript", "strict.mdc"),
    );
    expect(typescriptStrictContent).toContain("TypeScript Strict Mode Rules");
    expect(typescriptStrictContent).toContain("Use strict type checking");

    const testingE2eContent = readTestFile(
      path.join(".cursor", "rules", "aicm", "testing", "e2e.mdc"),
    );
    expect(testingE2eContent).toContain("E2E Testing Best Practices");
    expect(testingE2eContent).toContain(
      "Test user journeys, not implementation details",
    );

    const explicitRuleContent = readTestFile(
      path.join(".cursor", "rules", "aicm", "explicit-rule.mdc"),
    );
    expect(explicitRuleContent).toContain("Explicit Rule");
    expect(explicitRuleContent).toContain(
      "not discovered through glob patterns",
    );
  });

  it("should handle empty glob patterns gracefully", async () => {
    await setupFromFixture("install-glob-basic");

    // Create a config with a glob pattern that matches no files
    const configContent = {
      ides: ["cursor"],
      rules: {
        "empty-pattern": "./rules/nonexistent/*.mdc",
        "explicit-rule": "./rules/explicit.mdc",
      },
    };

    // Remove the original config and create a new one with only our test patterns
    fs.removeSync("aicm.json");
    fs.writeFileSync("aicm.json", JSON.stringify(configContent, null, 2));

    const { stdout, code } = await runCommand("install");

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    // Explicit rule should still be installed even when glob pattern is empty
    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "explicit-rule.mdc")),
    ).toBe(true);

    // Empty pattern should not create any files
    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "empty-pattern")),
    ).toBe(false);
  });

  it("should handle mixed glob patterns and explicit rules", async () => {
    await setupFromFixture("install-glob-basic");

    const { stdout, code } = await runCommand("install");

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");

    // Check that both glob-discovered and explicit rules are installed
    expect(
      fileExists(
        path.join(".cursor", "rules", "aicm", "typescript", "interfaces.mdc"),
      ),
    ).toBe(true);
    expect(
      fileExists(
        path.join(".cursor", "rules", "aicm", "typescript", "strict.mdc"),
      ),
    ).toBe(true);
    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "testing", "e2e.mdc")),
    ).toBe(true);
    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "testing", "unit.mdc")),
    ).toBe(true);
    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "explicit-rule.mdc")),
    ).toBe(true);
  });
});
