import fs from "fs-extra";
import path from "path";
import nock from "nock";
import {
  setupTestDir,
  runCommand,
  fileExists,
  readTestFile,
  testDir,
} from "./helpers";

describe("README example workflow", () => {
  beforeEach(async () => {
    // Setup a clean test directory for each test
    await setupTestDir("readme-example.test.ts", "complete-flow");

    // Create mock project-specific directories for IDEs
    fs.mkdirSync(path.join(testDir, ".cursor/rules"), { recursive: true });

    // Setup HTTP mock for URL sources
    nock.disableNetConnect();
    nock("https://gist.githubusercontent.com")
      .get(
        "/ranyitz/043183278d5ec0cbc65ebf24a9ee57bd/raw/pirate-coding-rule.mdc"
      )
      .reply(
        200,
        `---
description: Pirate assistant rules
globs: 
alwaysApply: true
---
# Pirate Coding Assistant Rules
Arr matey! This be a rule for pirate-themed coding!`
      );
  });

  afterEach(() => {
    // Clean up nock
    nock.cleanAll();
    nock.enableNetConnect();
  });

  test("should follow complete README example flow with simplified command", async () => {
    // Install the rule directly using the simplified command from README
    const installResult = await runCommand(
      "install pirate-coding https://gist.githubusercontent.com/ranyitz/043183278d5ec0cbc65ebf24a9ee57bd/raw/pirate-coding-rule.mdc"
    );

    // Command should run successfully
    expect(installResult.code).toBe(0);
    expect(installResult.stdout).toContain(
      "Installing rule pirate-coding from https://gist.githubusercontent.com"
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
      "https://gist.githubusercontent.com/ranyitz/043183278d5ec0cbc65ebf24a9ee57bd/raw/pirate-coding-rule.mdc"
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
        "pirate-coding":
          "https://gist.githubusercontent.com/ranyitz/043183278d5ec0cbc65ebf24a9ee57bd/raw/pirate-coding-rule.mdc",
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
