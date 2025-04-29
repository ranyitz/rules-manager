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
    await setupTestDir(expect.getState().currentTestName);

    // Create mock project-specific directories for IDEs
    fs.mkdirSync(path.join(testDir, ".cursor/rules"), { recursive: true });

    // Create a mock node_modules structure for the pirate-coding-rule package
    const npmPackagePath = path.join(
      testDir,
      "node_modules",
      "pirate-coding-rule"
    );
    fs.mkdirSync(npmPackagePath, { recursive: true });

    // Create package.json for the mock npm package
    fs.writeJsonSync(path.join(npmPackagePath, "package.json"), {
      name: "pirate-coding-rule",
      version: "1.0.0",
      main: "index.js",
    });

    // Create the rule file in the npm package
    fs.writeFileSync(
      path.join(npmPackagePath, "rule.mdc"),
      `---
description: Pirate assistant rules
globs: 
alwaysApply: true
---
# Pirate Coding Assistant Rules
Arr matey! This be a rule for pirate-themed coding!`
    );

    // Create a dummy index.js file
    fs.writeFileSync(
      path.join(npmPackagePath, "index.js"),
      "// This is a dummy file for the package"
    );
  });

  test("should follow complete README example flow with simplified command", async () => {
    // Install the rule directly using the simplified command from README
    const installResult = await runCommand(
      "install pirate-coding pirate-coding-rule/rule.mdc"
    );

    // Command should run successfully
    expect(installResult.code).toBe(0);

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
    expect(config.rules["pirate-coding"]).toBe("pirate-coding-rule/rule.mdc");

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
    // First create a rules directory for local rule
    fs.mkdirSync(path.join(testDir, "rules"), { recursive: true });

    // Create a local rule file for backward compatibility test
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

    // Verify rule was installed properly
    expect(fileExists(path.join(".cursor", "rules", "pirate-coding.mdc"))).toBe(
      true
    );
  });
});
