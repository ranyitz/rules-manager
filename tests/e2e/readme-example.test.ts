import {
  setupFromFixture,
  runCommand,
  fileExists,
  runNpmInstall,
} from "./helpers";
import path from "path";

describe("README demo example", () => {
  test("should install rules from preset as shown in the README", async () => {
    await setupFromFixture("readme-demo");
    const npmResult = await runNpmInstall("pirate-coding");
    expect(npmResult.code).toBe(0);
    const { stdout } = await runCommand("install --ci");
    expect(stdout).toContain("Rules installation completed");
    expect(
      fileExists(
        path.join(".cursor", "rules", "aicm", "pirate-coding", "rule.mdc"),
      ),
    ).toBe(true);
    expect(fileExists(path.join(".cursor", "mcp.json"))).toBe(true);
  });
});
