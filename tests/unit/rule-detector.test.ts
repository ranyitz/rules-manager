import { detectRuleType } from "../../src/utils/rule-detector";
import fs from "fs-extra";
import path from "path";

// Mock fs.existsSync and require.resolve for testing
jest.mock("fs-extra", () => ({
  existsSync: jest.fn(),
}));

// Mock require.resolve
const originalRequireResolve = require.resolve;
jest.mock("module", () => {
  const originalModule = jest.requireActual("module");
  return {
    ...originalModule,
    _resolveFilename: jest.fn(),
  };
});

describe("rule-detector", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock behavior
    (fs.existsSync as jest.Mock).mockImplementation((path) => {
      if (path.includes("node_modules/some-package")) return true;
      if (path.includes("node_modules/rule-package")) return true;
      if (path.includes("node_modules/@company")) return true;
      return false;
    });

    // Mock require.resolve to succeed for npm packages
    jest.spyOn(require, "resolve").mockImplementation((request, options) => {
      if (request === "some-package" || request === "@company/rule-package") {
        return "/mocked/path/to/package";
      }
      throw new Error("Cannot find module");
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("detectRuleType", () => {
    test("should throw error for URL rules", () => {
      expect(() => detectRuleType("https://example.com/rule.mdc")).toThrow();
      expect(() =>
        detectRuleType("http://example.com/rules/test.mdc")
      ).toThrow();
      expect(() =>
        detectRuleType("https://gist.github.com/user/123abc")
      ).toThrow();
    });

    test("should detect NPM package rules", () => {
      // Basic npm packages
      expect(detectRuleType("@company/rule-package")).toBe("npm");
      expect(detectRuleType("some-package")).toBe("npm");

      // npm packages with paths
      expect(detectRuleType("some-package/path/to/rule.mdc")).toBe("npm");
      expect(detectRuleType("@company/rule-package/file.mdc")).toBe("npm");
    });

    test("should detect local file rules", () => {
      // Relative paths
      expect(detectRuleType("./rules/local.mdc")).toBe("local");
      expect(detectRuleType("../parent/rules/test.mdc")).toBe("local");

      // Absolute paths
      expect(detectRuleType("/absolute/path/to/rule.mdc")).toBe("local");

      // Path that looks like npm but isn't in node_modules
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      jest.spyOn(require, "resolve").mockImplementation(() => {
        throw new Error("Cannot find module");
      });
      expect(detectRuleType("relative/path/to/rule.mdc")).toBe("local");
    });
  });
});
