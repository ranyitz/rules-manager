import { setupFromFixture, runCommand } from "./helpers";

describe("rules-manager list command with fixtures", () => {
  test("should list all rules in the config", async () => {
    // Setup the test directory using a fixture
    await setupFromFixture(
      "list-with-multiple-rules",
      expect.getState().currentTestName,
    );

    // List the rules
    const { stdout, stderr, code } = await runCommand("list");

    // Command should run successfully
    expect(code).toBe(0);

    // Verify all rules are listed in the output
    expect(stdout).toContain("rule1");
    expect(stdout).toContain("rule2");
    expect(stdout).toContain("rule3");
  });

  test("should show message when no rules exist", async () => {
    // Setup the test directory using a fixture
    await setupFromFixture(
      "list-with-no-rules",
      expect.getState().currentTestName,
    );

    // List rules when none have been added
    const { stdout, stderr, code } = await runCommand("list");

    // Command should run successfully
    expect(code).toBe(0);

    // Check the output message
    expect(stdout + stderr).toMatch(/no rules|empty|not found/i);
  });
});
