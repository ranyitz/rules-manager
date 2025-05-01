import {
  setupFromFixture,
  runCommand,
  fileExists,
  readTestFile,
  testDir,
} from "./helpers";
import path from "path";
import fs from "fs-extra";

describe("README example workflow with fixtures", () => {
  test("should follow complete README example flow with simplified command", async () => {
    // Setup the test directory using a fixture
    await setupFromFixture("readme-example", expect.getState().currentTestName);

    // Install the rule directly using the simplified command from README
    const installResult = await runCommand(
      "install pirate-coding pirate-coding-rule/rule.mdc",
    );

    // Command should run successfully
    expect(installResult.code).toBe(0);

    expect(installResult.stdout).toContain(
      "Configuration file not found. Creating a new one",
    );
    expect(installResult.stdout).toContain(
      "Configuration updated successfully",
    );
    expect(installResult.stdout).toContain("Rule installation complete");

    // Verify config file was created
    expect(fileExists("rules-manager.json")).toBe(true);

    // Verify config contains the correct rule
    const config = JSON.parse(readTestFile("rules-manager.json"));
    expect(config.rules["pirate-coding"]).toBe("pirate-coding-rule/rule.mdc");

    // Verify rule was installed properly
    expect(fileExists(path.join(".cursor", "rules", "pirate-coding.mdc"))).toBe(
      true,
    );

    // Verify content of installed rule contains expected pirate-themed text
    const ruleContent = readTestFile(
      path.join(".cursor", "rules", "pirate-coding.mdc"),
    );

    // Check for content that should be in the rule
    expect(ruleContent).toContain("Pirate Coding Assistant Rules");
    expect(ruleContent).toContain("Arr matey!");
  });
});
