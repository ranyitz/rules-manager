import { detectRuleType } from "../../src/utils/rule-detector";

describe("rule-detector", () => {
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
      expect(detectRuleType("@company/rule-package")).toBe("npm");
      expect(detectRuleType("rule-package")).toBe("npm");
      expect(detectRuleType("some-package-name")).toBe("npm");
    });

    test("should detect local file rules", () => {
      expect(detectRuleType("./rules/local.mdc")).toBe("local");
      expect(detectRuleType("../parent/rules/test.mdc")).toBe("local");
      expect(detectRuleType("/absolute/path/to/rule.mdc")).toBe("local");
      expect(detectRuleType("relative/path/to/rule.mdc")).toBe("local");
    });
  });
});
