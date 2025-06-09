import { setupFromFixture, runCommand } from "./helpers";

test("show help when no command is provided", async () => {
  await setupFromFixture("single-rule");

  const { stdout, code } = await runCommand("--help");

  expect(code).toBe(0);
  expect(stdout).toContain("aicm v2");
  expect(stdout).toContain("CLI tool for managing AI IDE configurations (v2)");
  expect(stdout).toContain("install");
  expect(stdout).toContain("aicm-v2");
});

test("show version", async () => {
  await setupFromFixture("single-rule");

  const { stdout, code } = await runCommand("--version");

  expect(code).toBe(0);
  expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
});
