import { setupFromFixture, runCommand } from "./helpers";

describe("aicm list command with fixtures", () => {
  test("should list all rules in the config", async () => {
    await setupFromFixture(
      "list-with-multiple-rules",
      expect.getState().currentTestName,
    );

    const { stdout, code } = await runCommand("list");

    expect(code).toBe(0);

    expect(stdout).toContain("rule1");
    expect(stdout).toContain("rule2");
    expect(stdout).toContain("rule3");
  });

  test("should show message when no rules exist", async () => {
    await setupFromFixture(
      "list-with-no-rules",
      expect.getState().currentTestName,
    );

    const { stdout, stderr, code } = await runCommand("list");

    expect(code).toBe(0);

    expect(stdout + stderr).toMatch(/no rules|empty|not found/i);
  });
});
