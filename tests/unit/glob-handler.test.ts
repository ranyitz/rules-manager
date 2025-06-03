// Mock fast-glob module
const mockFg = jest.fn();
jest.mock("fast-glob", () => mockFg);

import {
  isGlobPattern,
  generateGlobRuleKey,
  getGlobBase,
  expandGlobPattern,
  expandRulesGlobPatterns,
} from "../../src/utils/glob-handler";

describe("Glob Handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isGlobPattern", () => {
    it("should detect glob patterns with *", () => {
      expect(isGlobPattern("./rules/*.mdc")).toBe(true);
      expect(isGlobPattern("./rules/**/*.mdc")).toBe(true);
    });

    it("should detect glob patterns with ?", () => {
      expect(isGlobPattern("./rules/rule?.mdc")).toBe(true);
    });

    it("should detect glob patterns with brackets", () => {
      expect(isGlobPattern("./rules/rule[123].mdc")).toBe(true);
      expect(isGlobPattern("./rules/{a,b,c}.mdc")).toBe(true);
    });

    it("should not detect regular file paths", () => {
      expect(isGlobPattern("./rules/simple.mdc")).toBe(false);
      expect(isGlobPattern("./rules/nested/file.mdc")).toBe(false);
    });
  });

  describe("getGlobBase", () => {
    it("should extract base directory from simple glob", () => {
      expect(getGlobBase("./rules/*.mdc")).toBe("./rules");
      expect(getGlobBase("./rules/typescript/*.mdc")).toBe(
        "./rules/typescript",
      );
    });

    it("should extract base directory from recursive glob", () => {
      expect(getGlobBase("./rules/**/*.mdc")).toBe("./rules");
      expect(getGlobBase("./src/rules/**/*.mdc")).toBe("./src/rules");
    });

    it("should handle patterns without glob characters", () => {
      expect(getGlobBase("./rules/file.mdc")).toBe("./rules");
    });
  });

  describe("generateGlobRuleKey", () => {
    it("should generate key with base namespace", () => {
      const result = generateGlobRuleKey(
        "./rules/typescript/strict.mdc",
        "typescript",
        "./rules/typescript",
      );
      expect(result).toBe("typescript/strict");
    });

    it("should handle nested subdirectories", () => {
      const result = generateGlobRuleKey(
        "./rules/testing/unit/setup.mdc",
        "testing",
        "./rules/testing",
      );
      expect(result).toBe("testing/unit/setup");
    });

    it("should normalize path separators", () => {
      const result = generateGlobRuleKey(
        ".\\rules\\typescript\\strict.mdc",
        "typescript",
        ".\\rules\\typescript",
      );
      expect(result).toBe("typescript/strict");
    });
  });

  describe("expandGlobPattern", () => {
    it("should expand glob pattern to matching files", async () => {
      mockFg.mockResolvedValue([
        "rules/typescript/strict.mdc",
        "rules/typescript/interfaces.mdc",
      ]);

      const result = await expandGlobPattern("./rules/typescript/*.mdc");

      expect(result).toEqual([
        "rules/typescript/interfaces.mdc",
        "rules/typescript/strict.mdc",
      ]);
    });

    it("should filter to only .mdc files", async () => {
      mockFg.mockResolvedValue([
        "rules/typescript/strict.mdc",
        "rules/typescript/readme.md",
        "rules/typescript/interfaces.mdc",
      ]);

      const result = await expandGlobPattern("./rules/typescript/*");

      expect(result).toEqual([
        "rules/typescript/interfaces.mdc",
        "rules/typescript/strict.mdc",
      ]);
    });

    it("should sort results alphabetically", async () => {
      mockFg.mockResolvedValue([
        "rules/z-rule.mdc",
        "rules/a-rule.mdc",
        "rules/m-rule.mdc",
      ]);

      const result = await expandGlobPattern("./rules/*.mdc");

      expect(result).toEqual([
        "rules/a-rule.mdc",
        "rules/m-rule.mdc",
        "rules/z-rule.mdc",
      ]);
    });

    it("should handle glob errors", async () => {
      mockFg.mockRejectedValue(new Error("Permission denied"));

      await expect(expandGlobPattern("./rules/*.mdc")).rejects.toThrow(
        'Error expanding glob pattern "./rules/*.mdc": Permission denied',
      );
    });
  });

  describe("expandRulesGlobPatterns", () => {
    it("should expand glob patterns and preserve explicit rules", async () => {
      mockFg
        .mockResolvedValueOnce([
          "rules/typescript/strict.mdc",
          "rules/typescript/interfaces.mdc",
        ])
        .mockResolvedValueOnce(["rules/testing/unit.mdc"]);

      const rules = {
        typescript: "./rules/typescript/*.mdc",
        testing: "./rules/testing/*.mdc",
        explicit: "./rules/explicit.mdc",
      };

      const result = await expandRulesGlobPatterns(rules);

      expect(result.expandedRules).toEqual({
        "typescript/interfaces": "rules/typescript/interfaces.mdc",
        "typescript/strict": "rules/typescript/strict.mdc",
        "testing/unit": "rules/testing/unit.mdc",
        explicit: "./rules/explicit.mdc",
      });

      expect(result.globSources).toEqual({
        "typescript/interfaces": "./rules/typescript/*.mdc",
        "typescript/strict": "./rules/typescript/*.mdc",
        "testing/unit": "./rules/testing/*.mdc",
      });
    });

    it("should skip false values", async () => {
      const rules = {
        typescript: "./rules/typescript/*.mdc",
        disabled: false as const,
      };

      mockFg.mockResolvedValue(["rules/typescript/strict.mdc"]);

      const result = await expandRulesGlobPatterns(rules);

      expect(result.expandedRules).toEqual({
        "typescript/strict": "rules/typescript/strict.mdc",
      });
    });

    it("should handle empty glob results", async () => {
      mockFg.mockResolvedValue([]);

      // Mock console.warn to avoid output during tests
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const rules = {
        empty: "./rules/empty/*.mdc",
      };

      const result = await expandRulesGlobPatterns(rules);

      expect(result.expandedRules).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'Warning: Glob pattern "./rules/empty/*.mdc" matched no files',
      );

      consoleSpy.mockRestore();
    });

    it("should handle glob expansion errors", async () => {
      mockFg.mockRejectedValue(new Error("Invalid pattern"));

      const rules = {
        "bad-pattern": "./rules/[invalid.mdc",
      };

      await expect(expandRulesGlobPatterns(rules)).rejects.toThrow(
        'Error processing glob pattern for key "bad-pattern"',
      );
    });
  });
});
