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
    await setupFromFixture("readme-example", expect.getState().currentTestName);

    const installResult = await runCommand(
      "install pirate-coding pirate-coding-rule/rule.mdc",
    );

    expect(installResult.code).toBe(0);

    expect(installResult.stdout).toContain(
      "Configuration file not found. Creating a new one",
    );
    expect(installResult.stdout).toContain(
      "Configuration updated successfully",
    );
    expect(installResult.stdout).toContain("Rule installation complete");

    expect(fileExists("rules.json")).toBe(true);

    const config = JSON.parse(readTestFile("rules.json"));
    expect(config.rules["pirate-coding"]).toBe("pirate-coding-rule/rule.mdc");

    expect(fileExists(path.join(".cursor", "rules", "pirate-coding.mdc"))).toBe(
      true,
    );

    const ruleContent = readTestFile(
      path.join(".cursor", "rules", "pirate-coding.mdc"),
    );

    expect(ruleContent).toContain("Pirate Coding Assistant Rules");
    expect(ruleContent).toContain("Arr matey!");
  });
});
