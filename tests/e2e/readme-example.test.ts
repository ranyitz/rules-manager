import { setupFromFixture, runCommand, fileExists } from "./helpers";
import path from "path";

test("should install rules from preset as shown in the README", async () => {
  await setupFromFixture("presets-npm");

  const { stdout } = await runCommand("install --ci");

  expect(stdout).toContain("Successfully installed 1 rule");

  expect(
    fileExists(
      path.join(
        ".cursor",
        "rules",
        "aicm",
        "@company",
        "ai-rules",
        "npm-rule.mdc",
      ),
    ),
  ).toBe(true);
});
