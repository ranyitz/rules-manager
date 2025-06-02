import {
  setupFromFixture,
  runCommand,
  runFailedCommand,
  runCommandRaw,
} from "./helpers";

describe("Command helper methods demonstration", () => {
  test("runCommand should automatically assert success", async () => {
    await setupFromFixture("install-from-config");

    // This will automatically assert exit code 0 and throw with debugging if it fails
    const { stdout } = await runCommand("install --ci");

    expect(stdout).toContain("Rules installation completed");
  });

  test("runFailedCommand should automatically assert failure", async () => {
    await setupFromFixture("install-no-rules");

    // This will automatically assert exit code 1 and throw with debugging if it succeeds
    const { stderr } = await runFailedCommand("install --ci");

    expect(stderr).toContain("No rules defined in configuration");
  });

  test("runCommandRaw should not assert anything", async () => {
    await setupFromFixture("install-from-config");

    // This preserves the original behavior - no automatic assertions
    const { code, stdout } = await runCommandRaw("install --ci");

    expect(code).toBe(0);
    expect(stdout).toContain("Rules installation completed");
  });

  test("runCommandRaw for manual failure handling", async () => {
    await setupFromFixture("install-no-rules");

    // Manual handling of expected failure
    const { code, stderr } = await runCommandRaw("install --ci");

    expect(code).toBe(1);
    expect(stderr).toContain("No rules defined in configuration");
  });
});
