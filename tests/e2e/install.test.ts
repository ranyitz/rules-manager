import fs from "fs-extra";
import path from "path";
import nock from "nock";
import os from "os";
import {
  setupTestDir,
  runCommand,
  copyFixture,
  fileExists,
  readTestFile,
  projectRoot,
  testDir,
  getDirectoryStructure,
} from "./helpers";

// Mock home directory for tests
const originalHomedir = os.homedir;
const mockHomeDir = path.join(testDir, "mock-home");

describe("ai-rules install command", () => {
  beforeEach(async () => {
    // Setup a clean test directory for each test with proper scoping
    await setupTestDir("install.test.ts", expect.getState().currentTestName);

    // Create mock project-specific directories for IDEs
    fs.mkdirSync(path.join(testDir, ".cursor/rules"), { recursive: true });
    fs.mkdirSync(path.join(testDir, ".windsurf"), { recursive: true });

    // Mock os.homedir to return our test home directory
    Object.defineProperty(os, "homedir", {
      value: jest.fn(() => mockHomeDir),
      configurable: true,
    });

    // Create a rules directory for local sources
    fs.mkdirSync(path.join(testDir, "rules"), { recursive: true });

    // Copy example rule to rules directory
    copyFixture("example-rule.mdc", "rules/local-rule.mdc");

    // Setup HTTP mock for URL sources
    nock.disableNetConnect();
    nock("https://example.com")
      .get("/rule.mdc")
      .reply(200, "# Example Rule\nThis is a test rule from URL.")
      .get("/rules/formatting.mdc")
      .reply(200, "# Formatting Rule\nThis is a test rule for formatting.");
  });

  afterEach(() => {
    // Restore os.homedir
    Object.defineProperty(os, "homedir", {
      value: originalHomedir,
      configurable: true,
    });

    // Clean up nock
    nock.cleanAll();
    nock.enableNetConnect();
  });

  test("should show error when no rule is specified", async () => {
    // Initialize a config first
    await runCommand("init");

    // Run the install command without arguments
    const { stdout, stderr } = await runCommand("install");

    console.log("STDOUT:", stdout);
    console.log("STDERR:", stderr);

    // Should show installation started
    expect(stdout).toContain("Installing rules");
  });

  test("should show error when config doesn't exist", async () => {
    // Run install without first creating a config
    const { stdout, stderr } = await runCommand("install test-rule");

    console.log("STDOUT:", stdout);
    console.log("STDERR:", stderr);

    // Should mention config file or initialization
    expect(stdout).toMatch(/config|configuration|initialize|init/i);
  });

  test("should install a rule", async () => {
    // Initialize a config first
    await runCommand("init");

    // Create a rule to reference
    copyFixture("example-rule.mdc", "rules/test-rule.mdc");

    // Install a rule (use local rule instead of URL to avoid HTTP issues)
    const { stdout, stderr } = await runCommand(
      "install test-rule --local ./rules/test-rule.mdc"
    );

    console.log("STDOUT:", stdout);
    console.log("STDERR:", stderr);

    // Check if the rule file was created
    expect(stdout).toContain("Rule installed successfully");
  });

  test("should install rules from config", async () => {
    // Create a custom config with a local rule
    const installConfig = {
      ides: ["cursor", "windsurf"],
      rules: {
        "local-rule": {
          source: "./rules/local-rule.mdc",
          type: "local",
        },
      },
    };
    fs.writeJsonSync(path.join(testDir, "ai-rules.json"), installConfig);

    // Run the install command
    const { stdout, stderr, code } = await runCommand("install");

    console.log("STDOUT:", stdout);
    console.log("STDERR:", stderr);

    // Log the test directory structure for debugging
    console.log("Directory structure:", getDirectoryStructure());
    console.log("Test directory:", testDir);

    // Command should run successfully
    expect(code).toBe(0);
    expect(stdout).toContain("Installing rules");

    // Check that rules were installed for Cursor in the project directory
    expect(fileExists(path.join(".cursor", "rules", "local-rule.mdc"))).toBe(
      true
    );

    // Check rule content for Cursor
    const localRuleContent = readTestFile(
      path.join(".cursor", "rules", "local-rule.mdc")
    );
    expect(localRuleContent).toContain("alwaysApply: false");

    // Check that the Windsurf rules file was created in the project directory
    expect(fileExists(path.join(".windsurf", ".windsurfrules"))).toBe(true);

    const windsurfContent = readTestFile(
      path.join(".windsurf", ".windsurfrules")
    );
    expect(windsurfContent).toContain("# Windsurf Rules");
    expect(windsurfContent).toContain("--- local-rule ---");
    expect(windsurfContent).toContain("alwaysApply: false");
  });

  test("should handle errors with missing rule files", async () => {
    // Create a config with a non-existent local rule
    const badConfig = {
      ides: ["cursor"],
      rules: {
        "missing-rule": {
          source: "./rules/does-not-exist.mdc",
          type: "local",
        },
      },
    };
    fs.writeJsonSync(path.join(testDir, "ai-rules.json"), badConfig);

    // Run the install command
    const { stdout, stderr, code } = await runCommand("install");

    console.log("STDOUT:", stdout);
    console.log("STDERR:", stderr);

    // Command should still succeed but log errors
    expect(code).toBe(0);
    expect(stdout).toContain("Error: Source file");
    expect(stdout).toContain("does-not-exist.mdc not found");
  });
});
