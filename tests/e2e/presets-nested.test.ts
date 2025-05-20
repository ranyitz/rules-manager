import { describe, it, expect, afterEach } from "@jest/globals";
import { setupFromFixture, testDir } from "./helpers";
import { getConfig } from "../../src/utils/config";

describe("Nested presets", () => {
  // Store original working directory
  const originalCwd = process.cwd();

  afterEach(() => {
    // Restore original working directory
    process.chdir(originalCwd);
  });

  it("should recursively resolve nested presets", async () => {
    await setupFromFixture("presets-nested");
    // Change to test directory
    process.chdir(testDir);

    // Process.cwd() is now pointing to the test directory with our fixtures
    const config = getConfig();

    expect(config).not.toBeNull();

    // Check proper rule resolution from different levels
    expect(config!.rules).toHaveProperty(
      "topLevelRule",
      "rules/top-level-rule.js",
    );
    expect(config!.rules).toHaveProperty(
      "presetA-rule1",
      "rules/preset-a-rule1.js",
    );
    expect(config!.rules).toHaveProperty(
      "presetA-rule2",
      "rules/preset-a-rule2.js",
    );
    expect(config!.rules).toHaveProperty(
      "presetB-rule1",
      "rules/preset-b-rule1.js",
    );
    expect(config!.rules).toHaveProperty(
      "presetB-rule2",
      "rules/preset-b-rule2.js",
    );
    expect(config!.rules).toHaveProperty(
      "presetC-rule1",
      "rules/preset-c-rule1.js",
    );
    expect(config!.rules).toHaveProperty(
      "presetC-rule2",
      "rules/preset-c-rule2.js",
    );

    // Verify the correct number of rules (1 from top level + 2 from each preset)
    expect(Object.keys(config!.rules).length).toBe(7);
  });

  it("should handle circular references between presets", async () => {
    await setupFromFixture("presets-circular");
    // Change to test directory
    process.chdir(testDir);

    // Process.cwd() is now pointing to the test directory with our fixtures
    const config = getConfig();

    // Verify all rules are resolved correctly despite the circular reference
    expect(config).not.toBeNull();
    expect(config!.rules).toHaveProperty(
      "topLevelRule",
      "rules/top-level-rule.js",
    );
    expect(config!.rules).toHaveProperty(
      "circularA-rule",
      "rules/circular-a-rule.js",
    );
    expect(config!.rules).toHaveProperty(
      "circularB-rule",
      "rules/circular-b-rule.js",
    );
    expect(config!.rules).toHaveProperty(
      "circularC-rule",
      "rules/circular-c-rule.js",
    );

    // Verify the correct number of rules (1 from top level + 1 from each preset)
    expect(Object.keys(config!.rules).length).toBe(4);
  });
});
