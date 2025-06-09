// NOTE: This test has been migrated to the v2 e2e suite (tests/e2e-v2/ci.test.ts)
// This v1 version will be removed once the full migration is complete

import path from "path";
import fs from "fs-extra";
import {
  setupFromFixture,
  runCommand,
  runCommandRaw,
  fileExists,
  testDir,
} from "./helpers";
import { install as installApi } from "../../src/api";

// Helper to run command with CI=true environment variable
async function runCommandWithCI(args: string = "") {
  return runCommand(args, { env: { CI: "true" } });
}

// Helper function to run API calls with CI=true
async function runApiWithCI<T>(fn: () => Promise<T>): Promise<T> {
  const oldCI = process.env.CI;
  try {
    process.env.CI = "true";
    return await fn();
  } finally {
    process.env.CI = oldCI;
  }
}

describe("aicm install CI behavior", () => {
  const ruleName = "local-rule";
  const cursorRulePath = path.join(
    ".cursor",
    "rules",
    "aicm",
    `${ruleName}.mdc`,
  );

  let originalCIValue: string | undefined;

  beforeEach(() => {
    originalCIValue = process.env.CI;
    process.env.CI = "true";
  });

  afterEach(() => {
    if (originalCIValue === undefined) {
      delete process.env.CI;
    } else {
      process.env.CI = originalCIValue;
    }
  });

  describe("CLI Behavior", () => {
    test("should skip install on CI by default", async () => {
      await setupFromFixture("install-basic");

      const { stdout } = await runCommandWithCI("install");
      expect(stdout).toContain("Detected CI environment, skipping install");
      expect(fileExists(cursorRulePath)).toBe(false);
    });

    test("should install when --ci flag is used", async () => {
      await setupFromFixture("install-basic");

      const { stdout } = await runCommandWithCI("install --ci");
      expect(stdout).toContain("Rules installation completed");
      expect(fileExists(cursorRulePath)).toBe(true);
    });

    test("should proceed with install when NOT in CI (regardless of flags/config)", async () => {
      await setupFromFixture("install-basic");
      // Ensure we're NOT using CI=true for this test - we'll explicitly set it to false

      // Scenario 1: No flag, no special config
      let result = await runCommandRaw("install", { env: { CI: "false" } });
      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Rules installation completed");
      expect(fileExists(cursorRulePath)).toBe(true);
      fs.removeSync(path.join(testDir, ".cursor")); // Clean for next sub-test

      // Scenario 2: With --ci flag (should still install)
      result = await runCommandRaw("install --ci", { env: { CI: "false" } });
      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Rules installation completed");
      expect(fileExists(cursorRulePath)).toBe(true);
      fs.removeSync(path.join(testDir, ".cursor"));
    });
  });

  describe("Node API Behavior", () => {
    test("should skip install on CI by default", async () => {
      await setupFromFixture("install-basic");

      const result = await runApiWithCI(() => installApi({ cwd: testDir }));

      expect(result.success).toBe(true);
      expect(result.installedRuleCount).toBe(0);
      expect(fileExists(cursorRulePath)).toBe(false);
    });

    test("should install on CI when installOnCI option is true", async () => {
      await setupFromFixture("install-basic");

      const result = await runApiWithCI(() =>
        installApi({ cwd: testDir, installOnCI: true }),
      );

      expect(result.success).toBe(true);
      expect(result.installedRuleCount).toBeGreaterThan(0);
      expect(fileExists(cursorRulePath)).toBe(true);
    });

    test("should install when NOT in CI regardless of options", async () => {
      await setupFromFixture("install-basic");

      // Save original CI value
      const originalCI = process.env.CI;
      process.env.CI = "false";

      try {
        // Scenario 1: Default options
        let result = await installApi({ cwd: testDir });
        expect(result.success).toBe(true);
        expect(result.installedRuleCount).toBeGreaterThan(0);
        expect(fileExists(cursorRulePath)).toBe(true);
        fs.removeSync(path.join(testDir, ".cursor")); // Clean for next sub-test

        // Scenario 2: With installOnCI:true (should still install)
        result = await installApi({ cwd: testDir, installOnCI: true });
        expect(result.success).toBe(true);
        expect(result.installedRuleCount).toBeGreaterThan(0);
        expect(fileExists(cursorRulePath)).toBe(true);
      } finally {
        // Restore original CI value
        if (originalCI === undefined) {
          delete process.env.CI;
        } else {
          process.env.CI = originalCI;
        }
      }
    });
  });
});
