# ai-rules Configuration Guide

This document provides detailed information about configuring the `ai-rules` tool through the `ai-rules.json` configuration file.

## Configuration File Location

By default, ai-rules looks for the `ai-rules.json` file in the current working directory. This allows you to have different configurations for different projects.

## Configuration Structure

The configuration file uses JSON format with the following structure:

```json
{
  "ides": ["ide1", "ide2", ...],
  "rules": {
    "rule-name-1": "source-location-1",
    "rule-name-2": "source-location-2"
  }
}
```

## Configuration Fields

### ides

The `ides` field is an array of IDE names where the rules should be installed. Currently supported values:

- `"cursor"`: For the Cursor IDE
- `"windsurf"`: For the Windsurf IDE

Example:

```json
"ides": ["cursor", "windsurf"]
```

To target only a specific IDE:

```json
"ides": ["cursor"]
```

### rules

The `rules` field is an object containing rule configurations. Each key in this object is a unique name for the rule, and its value is a string representing the source location.

Example:

```json
"rules": {
  "eslint-standard": "https://example.com/rules/eslint.mdc"
}
```

## Rule Source Types

The type of rule is automatically detected based on the format of the source string:

### URL Sources

Rules hosted on public URLs such as GitHub, Gists, or any web-accessible location. Any source starting with `http://` or `https://` is detected as a URL.

Example:

```json
"typescript-rules": "https://github.com/user/typescript-rules/raw/main/typescript.mdc"
```

URLs must be direct links to the rule file content. For GitHub repositories, use the "raw" URL format.

### NPM Sources

Rules provided by NPM packages. The package must be installed either globally or in your project's `node_modules`. Sources that start with `@` or don't contain path separators are detected as NPM packages.

Example:

```json
"company-standards": "@company/ai-rules-package"
```

NPM package sources should follow the NPM package naming conventions. The package is expected to have a `.mdc` file with the same name as the rule (or in a predefined location within the package).

### Local Sources

Rules stored locally in your project or filesystem. Any path containing slashes or backslashes is detected as a local file path.

Example:

```json
"project-rules": "./rules/project-specific.mdc"
```

Local paths can be:

- Relative to the configuration file (starting with `./` or `../`)
- Absolute paths (starting with `/`)
- Relative paths without the leading `./`

## Complete Configuration Examples

### Basic Configuration

```json
{
  "ides": ["cursor"],
  "rules": {
    "formatting": "https://example.com/rules/formatting.mdc"
  }
}
```

### Multiple Rules with Different Sources

```json
{
  "ides": ["cursor", "windsurf"],
  "rules": {
    "typescript-best-practices": "https://github.com/user/typescript-rules/raw/main/typescript.mdc",
    "project-specific": "./rules/project-rules.mdc",
    "team-standards": "@company/coding-standards"
  }
}
```

### Corporate Setup with NPM Package

```json
{
  "ides": ["cursor", "windsurf"],
  "rules": {
    "company-style": "@acme/ai-rules-standard",
    "department-specific": "@acme/ai-rules-engineering",
    "project-overrides": "./project-rules.mdc"
  }
}
```

## Best Practices

1. **Use descriptive rule names**: Choose rule names that clearly describe the purpose or content of the rule.

2. **Consider rule priority**: Rules are processed in the order they appear in the configuration. For Windsurf, which concatenates rules, this order matters.

3. **Version control your configuration**: Include your `ai-rules.json` in version control to share consistent rules with your team.

4. **Use NPM packages for team standards**: For team or organization-wide rules, consider distributing them as an NPM package.

5. **Document your rules**: Include comments in your rule files to explain their purpose and any special considerations.

6. **Keep rules specific and focused**: Create separate rules for different concerns rather than one large rule file.

7. **Test your rules**: After installation, verify that your rules are working as expected in your IDE.

8. **Update regularly**: Review and update your rules regularly to ensure they remain relevant and effective.
