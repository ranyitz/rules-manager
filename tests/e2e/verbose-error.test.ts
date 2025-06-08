import { setupFromFixture, runFailedCommand } from "./helpers";

describe("aicm verbose error handling", () => {
  test("should show stack trace with --verbose flag on error", async () => {
    await setupFromFixture("install-missing-rules");

    const { stderr } = await runFailedCommand("install --ci --verbose");

    // Should contain the error message
    expect(stderr).toContain("Source file");
    expect(stderr).toContain("not found");

    // With verbose flag, should contain stack trace indicators
    // This tests that errorStack is properly populated and displayed
    expect(stderr).toMatch(/at .+\(.+:\d+:\d+\)/); // Should match stack trace format
  });

  test("should NOT show stack trace without --verbose flag on error", async () => {
    await setupFromFixture("install-missing-rules");

    const { stderr } = await runFailedCommand("install --ci");

    // Should contain the error message
    expect(stderr).toContain("Source file");
    expect(stderr).toContain("not found");

    // Without verbose flag, should NOT contain stack trace indicators
    // This ensures errorStack is not displayed when verbose is false
    expect(stderr).not.toMatch(/at .+\(.+:\d+:\d+\)/); // Should NOT match stack trace format
  });
});
