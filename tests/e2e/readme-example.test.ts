import fs from "fs-extra";
import path from "path";
import {
  setupTestDir,
  runCommand,
  fileExists,
  readTestFile,
  testDir,
  copyFixture,
} from "./helpers";

describe("README example workflow", () => {
  beforeEach(async () => {
    // Setup a clean test directory for each test
    await setupTestDir("readme-example.test.ts", "complete-flow");

    // Create mock project-specific directories for IDEs
    fs.mkdirSync(path.join(testDir, ".cursor/rules"), { recursive: true });

    // Create rules directory
    fs.mkdirSync(path.join(testDir, "rules"), { recursive: true });

    // Create a pirate rule file
    fs.writeFileSync(
      path.join(testDir, "rules", "pirate-coding-rule.mdc"),
      `---
description: Pirate assistant rules
globs: 
alwaysApply: true
---
# Pirate Coding Assistant Rules
Arr matey! This be a rule for pirate-themed coding!`
    );
  });

  test("should follow complete README example flow with simplified command", async () => {
    // Install the rule directly using the simplified command from README
    const installResult = await runCommand(
      "install pirate-coding ./rules/pirate-coding-rule.mdc"
    );

    // Command should run successfully
    expect(installResult.code).toBe(0);
    expect(installResult.stdout).toContain(
      "Installing rule pirate-coding from ./rules/pirate-coding-rule.mdc"
    );
    expect(installResult.stdout).toContain(
      "Configuration file not found. Creating a new one"
    );
    expect(installResult.stdout).toContain(
      "Configuration updated successfully"
    );
    expect(installResult.stdout).toContain("Rule installation complete");

    // Verify config file was created
    expect(fileExists("rules-manager.json")).toBe(true);

    // Verify config contains the correct rule
    const config = JSON.parse(readTestFile("rules-manager.json"));
    expect(config.rules["pirate-coding"]).toBe(
      "./rules/pirate-coding-rule.mdc"
    );

    // Verify rule was installed properly
    expect(fileExists(path.join(".cursor", "rules", "pirate-coding.mdc"))).toBe(
      true
    );

    // Verify content of installed rule contains expected pirate-themed text
    const ruleContent = readTestFile(
      path.join(".cursor", "rules", "pirate-coding.mdc")
    );

    // Check for content that should be in the rule
    expect(ruleContent).toContain(`---
description: Pirate assistant rules
globs: 
alwaysApply: true
---
# Pirate Coding Assistant Rules`);
  });

  test("should work with the old workflow too (for backward compatibility)", async () => {
    // Step 1: Initialize a configuration
    const initResult = await runCommand("init");
    expect(initResult.code).toBe(0);
    expect(initResult.stdout).toContain(
      "Configuration file created successfully"
    );
    expect(fileExists("rules-manager.json")).toBe(true);

    // Step 2: Create the config file directly (simulating the echo command in old README)
    const config = {
      ides: ["cursor"],
      rules: {
        "pirate-coding": "./rules/pirate-coding-rule.mdc",
      },
    };
    fs.writeJsonSync(path.join(testDir, "rules-manager.json"), config);

    // Step 3: Install the rule
    const installResult = await runCommand("install");
    expect(installResult.code).toBe(0);
    expect(installResult.stdout).toContain("Installing rules");

    // Verify rule was installed properly
    expect(fileExists(path.join(".cursor", "rules", "pirate-coding.mdc"))).toBe(
      true
    );
  });
});
