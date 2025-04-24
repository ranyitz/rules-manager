import fs from "fs-extra";
import path from "path";
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
  });

  test("should follow complete README example flow", async () => {
    // Step 1: Initialize a configuration
    const initResult = await runCommand("init");
    expect(initResult.code).toBe(0);
    expect(initResult.stdout).toContain(
      "Configuration file created successfully"
    );
    expect(fileExists("ai-rules.json")).toBe(true);

    // Step 2: Create the config file directly (simulating the echo command in README)
    const config = {
      ides: ["cursor"],
      rules: {
        "pirate-coding":
          "https://gist.githubusercontent.com/ranyitz/043183278d5ec0cbc65ebf24a9ee57bd/raw/97b71829d84cd06b176655d804fbbd93a9247fc1/pirate-coding-rule.mdc",
      },
    };
    fs.writeJsonSync(path.join(testDir, "ai-rules.json"), config);

    // Step 3: Install the rule
    const installResult = await runCommand("install");
    expect(installResult.code).toBe(0);
    expect(installResult.stdout).toContain("Installing rules");

    // Verify rule was installed properly
    expect(fileExists(path.join(".cursor", "rules", "pirate-coding.mdc"))).toBe(
      true
    );

    // Verify content of installed rule contains expected pirate-themed text
    const ruleContent = readTestFile(
      path.join(".cursor", "rules", "pirate-coding.mdc")
    );

    // Only check for content that we're confident will be in the actual gist
    expect(ruleContent).toContain(`---
description: Pirate assistant rules
globs: 
alwaysApply: true
---
# Pirate Coding Assistant Rules
`);
  });
});
