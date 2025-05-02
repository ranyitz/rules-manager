import fs from "fs-extra";
import { parseMdcFile } from "../../src/utils/mdc-parser";

jest.mock("fs-extra");

describe("MDC Parser", () => {
  describe("parseMdcFile", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should parse MDC file with metadata correctly", () => {
      const mockContent = `---
description: Always apply rule example
alwaysApply: true
globs: 
---

## Test Rule

This is a test rule that always applies.`;

      (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

      const result = parseMdcFile("/path/to/test.mdc");

      expect(result.metadata.alwaysApply).toBe(true);
      expect(result.metadata.description).toBe("Always apply rule example");
      expect(result.content).toBe(
        "## Test Rule\n\nThis is a test rule that always applies.",
      );

      expect(fs.readFileSync).toHaveBeenCalledWith("/path/to/test.mdc", "utf8");
    });

    it("should handle MDC file without metadata", () => {
      const mockContent = `## Test Rule

This is a test rule without metadata.`;

      (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

      const result = parseMdcFile("/path/to/test.mdc");

      expect(result.metadata).toEqual({});
      expect(result.content).toBe(mockContent);
    });

    it("should handle MDC file with empty metadata", () => {
      const mockContent = `---
---

## Test Rule

This is a test rule with empty metadata.`;

      (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

      const result = parseMdcFile("/path/to/test.mdc");

      expect(result.metadata).toEqual({});
      expect(result.content).toBe(
        "## Test Rule\n\nThis is a test rule with empty metadata.",
      );
    });

    it("should handle MDC file with boolean values in metadata", () => {
      const mockContent = `---
alwaysApply: false
isActive: true
---

## Test Rule

This is a test rule with boolean values.`;

      (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

      const result = parseMdcFile("/path/to/test.mdc");

      expect(result.metadata.alwaysApply).toBe(false);
      expect(result.metadata.isActive).toBe(true);
      expect(result.content).toBe(
        "## Test Rule\n\nThis is a test rule with boolean values.",
      );
    });

    it("should handle MDC file with opt-in rule structure", () => {
      const mockContent = `---
description: Opt-in rule example
alwaysApply: false
globs: 
---

## Test Rule

This is an opt-in rule that needs to be explicitly referenced.`;

      (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

      const result = parseMdcFile("/path/to/test.mdc");

      expect(result.metadata.alwaysApply).toBe(false);
      expect(result.metadata.description).toBe("Opt-in rule example");
      expect(result.content).toBe(
        "## Test Rule\n\nThis is an opt-in rule that needs to be explicitly referenced.",
      );
    });

    it("should handle MDC file with file-pattern rule structure", () => {
      const mockContent = `---
description: File pattern rule example
alwaysApply: false
globs: ["*.ts", "*.tsx"]
---

## TypeScript Best Practices

- Use strict type checking
- Prefer interfaces over types for public APIs
`;

      (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

      const result = parseMdcFile("/path/to/test.mdc");

      expect(result.metadata.description).toBe("File pattern rule example");
      expect(result.metadata.alwaysApply).toBe(false);
      expect(result.metadata.globs).toBe('["*.ts", "*.tsx"]');
      expect(result.content).toBe(
        "## TypeScript Best Practices\n\n- Use strict type checking\n- Prefer interfaces over types for public APIs",
      );
    });

    it("should handle MDC file with string values in metadata", () => {
      const mockContent = `---
title: "Test Rule"
description: "This is a test rule"
---

## Test Rule

This is a test rule with string values.`;

      (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

      const result = parseMdcFile("/path/to/test.mdc");

      expect(result.metadata.title).toBe("Test Rule");
      expect(result.metadata.description).toBe("This is a test rule");
      expect(result.content).toBe(
        "## Test Rule\n\nThis is a test rule with string values.",
      );
    });
  });
});
