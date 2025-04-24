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
} from "./helpers";

// Mock home directory for tests
const originalHomedir = os.homedir;
const mockHomeDir = path.join(testDir, "mock-home");

describe("ai-rules install command", () => {
  beforeEach(async () => {
    // Setup a clean test directory
    await setupTestDir();

    // Create mock home directories for IDEs
    fs.mkdirSync(path.join(mockHomeDir, ".cursor/rules"), { recursive: true });
    fs.mkdirSync(path.join(mockHomeDir, ".config/windsurf"), {
      recursive: true,
    });

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

  test("should show error when no config exists", async () => {
    // Run the install command without creating a config
    const { stdout, code } = await runCommand("install");

    // This should not fail but should show an error message
    expect(code).toBe(0);
    expect(stdout).toContain("Configuration file not found");
  });

  test("should install rules from config", async () => {
    // Create a custom config with a URL rule and a local rule
    const installConfig = {
      ides: ["cursor", "windsurf"],
      rules: {
        formatting: {
          source: "https://example.com/rules/formatting.mdc",
          type: "url",
        },
        "local-rule": {
          source: "./rules/local-rule.mdc",
          type: "local",
        },
      },
    };
    fs.writeJsonSync(path.join(testDir, "ai-rules.json"), installConfig);

    // Run the install command
    const { stdout, code } = await runCommand("install");

    // Command should run successfully
    expect(code).toBe(0);
    expect(stdout).toContain("Installing rules");

    // Check that rules were installed for Cursor
    expect(
      fileExists(path.join("mock-home", ".cursor", "rules", "formatting.mdc"))
    ).toBe(true);
    expect(
      fileExists(path.join("mock-home", ".cursor", "rules", "local-rule.mdc"))
    ).toBe(true);

    // Check rule content for Cursor
    const formattingContent = readTestFile(
      path.join("mock-home", ".cursor", "rules", "formatting.mdc")
    );
    expect(formattingContent).toContain("# Formatting Rule");

    const localRuleContent = readTestFile(
      path.join("mock-home", ".cursor", "rules", "local-rule.mdc")
    );
    expect(localRuleContent).toContain("# Example AI Rule");

    // Check that the Windsurf rules file was created with the rules
    expect(
      fileExists(
        path.join("mock-home", ".config", "windsurf", ".windsurfrules")
      )
    ).toBe(true);

    const windsurfContent = readTestFile(
      path.join("mock-home", ".config", "windsurf", ".windsurfrules")
    );
    expect(windsurfContent).toContain("# Windsurf Rules");
    expect(windsurfContent).toContain("--- formatting ---");
    expect(windsurfContent).toContain("# Formatting Rule");
    expect(windsurfContent).toContain("--- local-rule ---");
    expect(windsurfContent).toContain("# Example AI Rule");
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
    const { stdout, code } = await runCommand("install");

    // Command should still succeed but log errors
    expect(code).toBe(0);
    expect(stdout).toContain("Error: Source file");
    expect(stdout).toContain("not found");
  });
});
