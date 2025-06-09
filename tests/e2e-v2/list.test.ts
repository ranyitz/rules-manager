import { setupFromFixture, runCommand, runCommandRaw } from "./helpers";

test("should list all rules in the config", async () => {
  await setupFromFixture("list-multiple-rules");

  const { stdout } = await runCommand("list");

  expect(stdout).toContain("rule1");
  expect(stdout).toContain("rule2");
  expect(stdout).toContain("rule3");
});

test("should show message when no rules exist", async () => {
  await setupFromFixture("list-no-rules");

  const { stdout, stderr } = await runCommandRaw("list");

  expect(stdout + stderr).toMatch(/no rules|empty|not found/i);
});
