import { resolveGlobRules } from "../../src/utils/glob-resolver";
import path from "node:path";

// Mock globby
// We are mocking the module 'globby' and its named export 'globby'
jest.mock("globby", () => ({
  globby: jest.fn(),
}));

// Dynamically get the mocked globby to interact with it in tests
let mockGlobbyInternal: jest.Mock;

beforeAll(async () => {
  // Import the mocked module to get a reference to the mock function
  const globbyModule = await import("globby");
  mockGlobbyInternal = globbyModule.globby as jest.Mock;
});

describe("resolveGlobRules", () => {
  beforeEach(() => {
    // Clear mock calls and reset any predefined mock behavior before each test
    mockGlobbyInternal.mockClear();
    mockGlobbyInternal.mockReset(); // Resets implementations and resolved values
  });

  it("should resolve glob patterns and generate rule keys correctly", async () => {
    const baseDir = "/project";
    // Simulate globby returning absolute paths as it would with cwd and absolute:true
    const mockFiles = [
      path.join(baseDir, "rules", "rule-one.mdc"),
      path.join(baseDir, "rules", "sub", "rule-two.mdc"),
      path.join(baseDir, "another.mdc"), // A file in the baseDir itself
    ];
    mockGlobbyInternal.mockResolvedValue(mockFiles);

    const result = await resolveGlobRules("rules/**/*.mdc", baseDir);

    expect(mockGlobbyInternal).toHaveBeenCalledWith("rules/**/*.mdc", {
      cwd: baseDir,
      absolute: true,
      onlyFiles: true,
    });

    // Since mockFiles provides absolute paths, they should be used directly.
    expect(result).toEqual({
      "rule-one": path.join(baseDir, "rules", "rule-one.mdc"),
      "rule-two": path.join(baseDir, "rules", "sub", "rule-two.mdc"),
      another: path.join(baseDir, "another.mdc"),
    });
  });

  it("should handle filenames with multiple dots correctly", async () => {
    const baseDir = "/project/src";
    const mockFiles = [path.join(baseDir, "a.very.long.rule.name.mdc")];
    mockGlobbyInternal.mockResolvedValue(mockFiles);

    const result = await resolveGlobRules("*.mdc", baseDir);

    expect(mockGlobbyInternal).toHaveBeenCalledWith("*.mdc", {
      cwd: baseDir,
      absolute: true,
      onlyFiles: true,
    });
    expect(result).toEqual({
      "a.very.long.rule.name": path.join(baseDir, "a.very.long.rule.name.mdc"),
    });
  });

  it("should return an empty object if no files match", async () => {
    const baseDir = "/some/path";
    mockGlobbyInternal.mockResolvedValue([]); // Simulate globby finding no files

    const result = await resolveGlobRules("nonexistent/*.mdc", baseDir);

    expect(mockGlobbyInternal).toHaveBeenCalledWith("nonexistent/*.mdc", {
      cwd: baseDir,
      absolute: true,
      onlyFiles: true,
    });
    expect(result).toEqual({});
  });

  it("should correctly use baseDir for globby cwd option", async () => {
    const specificBaseDir = "/test/base/directory";
    mockGlobbyInternal.mockResolvedValue([]); // No files needed for this check

    await resolveGlobRules("*.mdc", specificBaseDir);

    expect(mockGlobbyInternal).toHaveBeenCalledWith("*.mdc", {
      cwd: specificBaseDir, // Verifying this specific baseDir was passed to globby
      absolute: true,
      onlyFiles: true,
    });
  });

  it("should strip only .mdc extension", async () => {
    const baseDir = "/project";
    const mockFiles = [
      path.join(baseDir, "rule.with.other.ext.mdc.other"), // Should become 'rule.with.other.ext.mdc'
      path.join(baseDir, "rule.md"), // Should become 'rule.md' (no .mdc to strip)
      path.join(baseDir, "rule.mdc"), // Should become 'rule'
    ];
    mockGlobbyInternal.mockResolvedValue(mockFiles);

    const result = await resolveGlobRules("**/*", baseDir);
    expect(result).toEqual({
      "rule.with.other.ext.mdc.other": path.join(
        baseDir,
        "rule.with.other.ext.mdc.other",
      ),
      "rule.md": path.join(baseDir, "rule.md"),
      rule: path.join(baseDir, "rule.mdc"),
    });
  });
});
