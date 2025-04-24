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
    "rule-name-1": {
      "source": "source-location",
      "type": "source-type"
    },
    "rule-name-2": {
      "source": "source-location",
      "type": "source-type"
    }
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

The `rules` field is an object containing rule configurations. Each key in this object is a unique name for the rule, and its value is an object with the following properties:

- `source`: The location of the rule file
- `type`: The type of source (`url`, `npm`, or `local`)

Example:

```json
"rules": {
  "eslint-standard": {
    "source": "https://example.com/rules/eslint.mdc",
    "type": "url"
  }
}
```

## Rule Source Types

### URL Sources (`"type": "url"`)

Rules hosted on public URLs such as GitHub, Gists, or any web-accessible location.

Example:

```json
"typescript-rules": {
  "source": "https://github.com/user/typescript-rules/raw/main/typescript.mdc",
  "type": "url"
}
```

URLs must be direct links to the rule file content. For GitHub repositories, use the "raw" URL format.

### NPM Sources (`"type": "npm"`)

Rules provided by NPM packages. The package must be installed either globally or in your project's `node_modules`.

Example:

```json
"company-standards": {
  "source": "@company/ai-rules-package",
  "type": "npm"
}
```

NPM package sources should follow the NPM package naming conventions. The package is expected to have a `.mdc` file with the same name as the rule (or in a predefined location within the package).

### Local Sources (`"type": "local"`)

Rules stored locally in your project or filesystem.

Example:

```json
"project-rules": {
  "source": "./rules/project-specific.mdc",
  "type": "local"
}
```

Local paths can be:

- Relative to the configuration file (starting with `./` or `../`)
- Absolute paths (starting with `/`)

## Complete Configuration Examples

### Basic Configuration

```json
{
  "ides": ["cursor"],
  "rules": {
    "formatting": {
      "source": "https://example.com/rules/formatting.mdc",
      "type": "url"
    }
  }
}
```

### Multiple Rules with Different Sources

```json
{
  "ides": ["cursor", "windsurf"],
  "rules": {
    "typescript-best-practices": {
      "source": "https://github.com/user/typescript-rules/raw/main/typescript.mdc",
      "type": "url"
    },
    "project-specific": {
      "source": "./rules/project-rules.mdc",
      "type": "local"
    },
    "team-standards": {
      "source": "@company/coding-standards",
      "type": "npm"
    }
  }
}
```

### Corporate Setup with NPM Package

```json
{
  "ides": ["cursor", "windsurf"],
  "rules": {
    "company-style": {
      "source": "@acme/ai-rules-standard",
      "type": "npm"
    },
    "department-specific": {
      "source": "@acme/ai-rules-engineering",
      "type": "npm"
    },
    "project-overrides": {
      "source": "./project-rules.mdc",
      "type": "local"
    }
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
