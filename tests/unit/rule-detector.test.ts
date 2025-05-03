import { detectRuleType } from "../../src/utils/rule-detector";
import fs from "fs-extra";
import path from "path";

jest.mock("fs-extra", () => ({
  existsSync: jest.fn(),
}));

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

    (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
      const normalizedPath = path.replace(/\\/g, "/");
      if (normalizedPath.includes("node_modules/some-package")) return true;
      if (normalizedPath.includes("node_modules/rule-package")) return true;
      if (normalizedPath.includes("node_modules/@company")) return true;
      return false;
    });

    jest.spyOn(require, "resolve").mockImplementation((request) => {
      if (request === "some-package" || request === "@company/rule-package") {
        return path.normalize("/mocked/path/to/package");
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
        detectRuleType("http://example.com/rules/test.mdc"),
      ).toThrow();
      expect(() =>
        detectRuleType("https://gist.github.com/user/123abc"),
      ).toThrow();
    });

    test("should detect NPM package rules", () => {
      expect(detectRuleType("@company/rule-package")).toBe("npm");
      expect(detectRuleType("some-package")).toBe("npm");

      expect(detectRuleType("some-package/path/to/rule.mdc")).toBe("npm");
      expect(detectRuleType("some-package\\path\\to\\rule.mdc")).toBe("npm");
      expect(detectRuleType("@company/rule-package/file.mdc")).toBe("npm");
      expect(detectRuleType("@company/rule-package\\file.mdc")).toBe("npm");
    });

    test("should detect local file rules", () => {
      expect(detectRuleType("./rules/local.mdc")).toBe("local");
      expect(detectRuleType(".\\rules\\local.mdc")).toBe("local");
      expect(detectRuleType("../parent/rules/test.mdc")).toBe("local");
      expect(detectRuleType("..\\parent\\rules\\test.mdc")).toBe("local");

      expect(detectRuleType("/absolute/path/to/rule.mdc")).toBe("local");
      expect(detectRuleType("C:\\absolute\\path\\to\\rule.mdc")).toBe("local");

      (fs.existsSync as jest.Mock).mockReturnValue(false);
      jest.spyOn(require, "resolve").mockImplementation(() => {
        throw new Error("Cannot find module");
      });
      expect(detectRuleType("relative/path/to/rule.mdc")).toBe("local");
      expect(detectRuleType("relative\\path\\to\\rule.mdc")).toBe("local");
    });
  });
});
