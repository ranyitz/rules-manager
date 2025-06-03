import path from "path";
import {
  setupFromFixture,
  runCommand,
  runFailedCommand,
  fileExists,
  readTestFile,
} from "./helpers";

describe("aicm workspaces support", () => {
  test("should discover and install rules from multiple packages", async () => {
    await setupFromFixture("workspaces-npm-basic");

    const { stdout } = await runCommand("install --workspaces --ci --verbose");
    expect(stdout).toContain("🔍 Discovering packages...");
    expect(stdout).toContain("Found 2 packages with aicm configurations:");
    expect(stdout).toContain("- packages/backend");
    expect(stdout).toContain("- packages/frontend");
    expect(stdout).toContain("📦 Installing configurations...");
    expect(stdout).toContain("✅ packages/backend (1 rules)");
    expect(stdout).toContain("✅ packages/frontend (1 rules)");
    expect(stdout).toContain(
      "Successfully installed 2 rules across 2 packages",
    );

    // Check that rules were installed in both packages
    expect(
      fileExists(
        path.join(
          "packages",
          "frontend",
          ".cursor",
          "rules",
          "aicm",
          "frontend-rule.mdc",
        ),
      ),
    ).toBe(true);

    expect(
      fileExists(
        path.join(
          "packages",
          "backend",
          ".cursor",
          "rules",
          "aicm",
          "backend-rule.mdc",
        ),
      ),
    ).toBe(true);

    // Verify rule content
    const frontendRule = readTestFile(
      path.join(
        "packages",
        "frontend",
        ".cursor",
        "rules",
        "aicm",
        "frontend-rule.mdc",
      ),
    );
    expect(frontendRule).toContain("Frontend Development Rules");

    const backendRule = readTestFile(
      path.join(
        "packages",
        "backend",
        ".cursor",
        "rules",
        "aicm",
        "backend-rule.mdc",
      ),
    );
    expect(backendRule).toContain("Backend Development Rules");
  });

  test("should show error when no packages found in workspaces", async () => {
    await setupFromFixture("workspaces-no-packages");

    const { stderr } = await runFailedCommand("install --workspaces --ci");

    expect(stderr).toContain("No packages with aicm configurations found");
  });

  test("should install normally when workspaces flag is used on single package", async () => {
    await setupFromFixture("install-basic");

    const { stdout } = await runCommand("install --workspaces --ci --verbose");
    expect(stdout).toContain("Found 1 packages with aicm configurations:");
    expect(stdout).toContain("- .");
    expect(stdout).toContain(
      "Successfully installed 1 rules across 1 packages",
    );

    expect(
      fileExists(path.join(".cursor", "rules", "aicm", "local-rule.mdc")),
    ).toBe(true);
  });

  test("should handle partial configurations (some packages with configs, some without)", async () => {
    await setupFromFixture("workspaces-partial-configs");

    const { stdout } = await runCommand("install --workspaces --ci --verbose");
    expect(stdout).toContain("🔍 Discovering packages...");
    expect(stdout).toContain("Found 2 packages with aicm configurations:");
    expect(stdout).toContain("- packages/with-config");
    expect(stdout).toContain("- packages/also-with-config");
    expect(stdout).not.toContain("- packages/without-config");
    expect(stdout).toContain("📦 Installing configurations...");
    expect(stdout).toContain("✅ packages/with-config (1 rules)");
    expect(stdout).toContain("✅ packages/also-with-config (1 rules)");
    expect(stdout).toContain(
      "Successfully installed 2 rules across 2 packages",
    );

    // Check that rules were installed only in packages with configs
    expect(
      fileExists(
        path.join(
          "packages",
          "with-config",
          ".cursor",
          "rules",
          "aicm",
          "package-one-rule.mdc",
        ),
      ),
    ).toBe(true);

    expect(
      fileExists(
        path.join(
          "packages",
          "also-with-config",
          ".cursor",
          "rules",
          "aicm",
          "package-three-rule.mdc",
        ),
      ),
    ).toBe(true);

    // Verify no rules were installed in the package without config
    expect(fileExists(path.join("packages", "without-config", ".cursor"))).toBe(
      false,
    );
  });

  test("should discover and install rules from deeply nested workspaces structure", async () => {
    await setupFromFixture("workspaces-npm-nested");

    const { stdout } = await runCommand("install --workspaces --ci --verbose");
    expect(stdout).toContain("🔍 Discovering packages...");
    expect(stdout).toContain("Found 3 packages with aicm configurations:");
    expect(stdout).toContain("- apps/web");
    expect(stdout).toContain("- packages/ui");
    expect(stdout).toContain("- tools/build");
    expect(stdout).toContain("📦 Installing configurations...");
    expect(stdout).toContain("✅ apps/web (1 rules)");
    expect(stdout).toContain("✅ packages/ui (1 rules)");
    expect(stdout).toContain("✅ tools/build (1 rules)");
    expect(stdout).toContain(
      "Successfully installed 3 rules across 3 packages",
    );

    // Check that rules were installed in all nested packages
    expect(
      fileExists(
        path.join(
          "apps",
          "web",
          ".cursor",
          "rules",
          "aicm",
          "web-app-rule.mdc",
        ),
      ),
    ).toBe(true);

    expect(
      fileExists(
        path.join(
          "packages",
          "ui",
          ".cursor",
          "rules",
          "aicm",
          "ui-components-rule.mdc",
        ),
      ),
    ).toBe(true);

    expect(
      fileExists(
        path.join(
          "tools",
          "build",
          ".cursor",
          "rules",
          "aicm",
          "build-tools-rule.mdc",
        ),
      ),
    ).toBe(true);
  });

  test("should discover and install rules from Bazel workspaces", async () => {
    await setupFromFixture("workspaces-bazel-basic");

    const { stdout } = await runCommand("install --workspaces --ci --verbose");
    expect(stdout).toContain("🔍 Discovering packages...");
    expect(stdout).toContain("Found 2 packages with aicm configurations:");
    expect(stdout).toContain("- services/api");
    expect(stdout).toContain("- services/worker");
    expect(stdout).toContain("📦 Installing configurations...");
    expect(stdout).toContain("✅ services/api (1 rules)");
    expect(stdout).toContain("✅ services/worker (1 rules)");
    expect(stdout).toContain(
      "Successfully installed 2 rules across 2 packages",
    );

    // Check that rules were installed in both Bazel services
    expect(
      fileExists(
        path.join(
          "services",
          "api",
          ".cursor",
          "rules",
          "aicm",
          "api-service-rule.mdc",
        ),
      ),
    ).toBe(true);

    expect(
      fileExists(
        path.join(
          "services",
          "worker",
          ".cursor",
          "rules",
          "aicm",
          "worker-service-rule.mdc",
        ),
      ),
    ).toBe(true);
  });

  test("should discover and install rules from mixed workspaces + Bazel structure", async () => {
    await setupFromFixture("workspaces-mixed");

    const { stdout } = await runCommand("install --workspaces --ci --verbose");
    expect(stdout).toContain("🔍 Discovering packages...");
    expect(stdout).toContain("Found 2 packages with aicm configurations:");
    expect(stdout).toContain("- frontend");
    expect(stdout).toContain("- backend-service");
    expect(stdout).toContain("📦 Installing configurations...");
    expect(stdout).toContain("✅ frontend (1 rules)");
    expect(stdout).toContain("✅ backend-service (1 rules)");
    expect(stdout).toContain(
      "Successfully installed 2 rules across 2 packages",
    );

    // Check that rules were installed in both mixed package types
    expect(
      fileExists(
        path.join("frontend", ".cursor", "rules", "aicm", "frontend-rule.mdc"),
      ),
    ).toBe(true);

    expect(
      fileExists(
        path.join(
          "backend-service",
          ".cursor",
          "rules",
          "aicm",
          "backend-service-rule.mdc",
        ),
      ),
    ).toBe(true);
  });

  test("should handle error scenarios with invalid configurations", async () => {
    await setupFromFixture("workspaces-error-scenarios");

    const { stdout } = await runFailedCommand(
      "install --workspaces --ci --verbose",
    );
    expect(stdout).toContain("🔍 Discovering packages...");
    expect(stdout).toContain("Found 2 packages with aicm configurations:");
    expect(stdout).toContain("- valid-package");
    expect(stdout).toContain("- missing-rule");
    expect(stdout).toContain("📦 Installing configurations...");
    expect(stdout).toContain("✅ valid-package (1 rules)");
    expect(stdout).toContain("❌ missing-rule:");
    expect(stdout).toContain("Installation completed with errors");

    // Check that the valid package still installed successfully
    expect(
      fileExists(
        path.join(
          "valid-package",
          ".cursor",
          "rules",
          "aicm",
          "valid-rule.mdc",
        ),
      ),
    ).toBe(true);

    // Check that the error package did not install anything
    expect(fileExists(path.join("missing-rule", ".cursor"))).toBe(false);
  });

  test("should work quietly by default without verbose flag", async () => {
    await setupFromFixture("workspaces-npm-basic");

    const { stdout } = await runCommand("install --workspaces --ci");
    expect(stdout).not.toContain("🔍 Discovering packages...");
    expect(stdout).not.toContain("Found 2 packages with aicm configurations:");
    expect(stdout).not.toContain("📦 Installing configurations...");
    expect(stdout).not.toContain("✅ packages/backend (1 rules)");
    expect(stdout).toContain(
      "Successfully installed 2 rules across 2 packages",
    );
  });
});
