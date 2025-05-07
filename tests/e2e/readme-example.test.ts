import {
  setupFromFixture,
  runCommand,
  fileExists,
  readTestFile,
} from "./helpers";
import path from "path";

describe("README demo example", () => {
  test("should install all rules from config as shown in the README", async () => {
    await setupFromFixture("readme-demo", expect.getState().currentTestName);

    const { stdout, code } = await runCommand("install");

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");
    expect(fileExists(path.join(".cursor", "rules", "pirate-coding.mdc"))).toBe(
      true,
    );
    const ruleContent = readTestFile(
      path.join(".cursor", "rules", "pirate-coding.mdc"),
    );
    expect(ruleContent).toContain("pirate");
  });
});
