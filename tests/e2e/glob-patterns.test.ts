import {
  setupFromFixture,
  runCommand,
  fileExists,
  readTestFile,
} from "./helpers";
import path from "node:path";

describe("aicm glob patterns", () => {
  it("should expand glob patterns and install rules with correct namespacing", async () => {
    await setupFromFixture("install-glob-basic");

    const { stdout } = await runCommand("install --verbose --ci");
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

  it("should handle mixed glob patterns and explicit rules", async () => {
    await setupFromFixture("install-glob-basic");

    const { stdout } = await runCommand("install --ci");
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
it("should handle empty glob patterns gracefully", async () => {
  await setupFromFixture("install-glob-empty");

  const { stdout } = await runCommand("install --ci");
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
