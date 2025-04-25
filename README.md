# 📜 rules-manager

A CLI tool for managing AI IDE rules across different projects

## Overview

Helps developers manage, share, and synchronize AI assistant rules across different projects and IDEs

## Features

- Share rules between team repositories to maintain consistent AI assistant behavior
- Install rules from multiple sources (URLs, npm packages, local files)
- Keep rules up to date with an npm package

## Future Plans

- Support additional IDEs, allowing a single rule to be used in multiple IDEs

## Getting Started

```bash
# Install a rule directly with a single command
npx rules-manager install pirate-coding https://gist.githubusercontent.com/ranyitz/043183278d5ec0cbc65ebf24a9ee57bd/raw/97b71829d84cd06b176655d804fbbd93a9247fc1/pirate-coding-rule.mdc
```

This command will:

1. Create a `rules-manager.json` file if it doesn't exist
2. Add the rule to the configuration
3. Install the rule to your Cursor IDE

After installation, open Cursor and ask for coding help. Your AI assistant will respond with pirate-themed coding advice.

> Warning: always inspect the rule contents before using it to avoid risks of [prompt-injection](https://en.wikipedia.org/wiki/Prompt_injection)

## Installation & Usage

```bash
# Use directly with npx
npx rules-manager <command>

# Install locally in a project
npm install --save-dev rules-manager
```

## Configuration

rules-manager uses a JSON configuration file (`rules-manager.json`) in your project root directory.

```json
{
  "ides": ["cursor"],
  "rules": {
    "typescript-best-practices": "https://github.com/user/typescript-rules/raw/main/typescript.mdc",
    "project-specific": "./rules/project-rules.mdc",
    "team-standards": "@company/coding-standards"
  }
}
```

- **ides**: Array of IDE names where rules should be installed. Currently supported values:

  - `"cursor"`: For the Cursor IDE

- **rules**: Object containing rule configurations
  - **rule-name**: A unique identifier for the rule
  - **source-location**: Location of the rule file (URL, path within an npm package, or local path)

### Rule Source Types

The type of rule is automatically detected based on the source format:

#### URL Source

Rules hosted on public URLs (GitHub, Gists, etc.). Any source starting with `http://` or `https://` is detected as a URL.

```json
"eslint-standard": "https://gist.github.com/user/abc123def456"
```

URLs must be direct links to the rule file content. For GitHub repositories, use the "raw" URL format.

#### NPM Source

Rules provided by NPM packages. The package must be installed either globally or in your project's `node_modules`. Sources that start with `@` or don't contain start with path separators are detected as NPM packages.

```json
"react-best-practices": "@company/rules-manager-react"
```

#### Local Source

Rules stored locally in your project or filesystem. Any path containing slashes or backslashes is detected as a local file path.

```json
"personal-rules": "./rules/custom.mdc"
```

## Supported IDEs

- **Cursor**: Rules are installed as individual `.mdc` files in the Cursor rules directory

## Recipes

### Automatic Rule Updates from NPM Packages

You can create, publish, and use dedicated npm packages to distribute AI rules across multiple projects.

Considering the following npm package:

```
@myteam/rules-manager/
├── package.json
└── rules/
    ├── typescript.mdc
    ├── react.mdc
    └── general.mdc
```

1. **Point to the path within the npm package**

In your project's `rules-manager.json`, reference the package and the specific rule:

```json
{
  "ides": ["cursor"],
  "rules": {
    "typescript": "@myteam/rules-manager/rules/typescript.mdc",
    "react": "@myteam/rules-manager/rules/react.mdc"
  }
}
```

When specifying a rule from an npm package:

- Include the package name (`@myteam/rules-manager`)
- Add the path to the specific rule file inside the package (`/rules/typescript.mdc`)

2. **Add a postinstall script** to your package.json:

   ```json
   {
     "scripts": {
       "postinstall": "rules-manager install"
     }
   }
   ```

> Warning: use packages from trusted sources to avoid risks of [prompt-injection](https://en.wikipedia.org/wiki/Prompt_injection)

## Commands

### Global Options

These options are available for all commands:

- `--help`, `-h`: Show help information
- `--version`, `-v`: Show version information

### `init`

Initializes a new configuration file in your current directory.

```bash
npx rules-manager init [options]
```

**Example:**

```bash
# Create a new configuration file
npx rules-manager init
```

### `install`

Installs rules from your configuration to the appropriate IDE locations.

```bash
npx rules-manager install [rule-name] [rule-source]
```

**Options:**

- `[rule-name]`: Optional - Name of a specific rule to install instead of all rules
- `[rule-source]`: Optional - Source of the rule (URL, npm package, or local path)

**Examples:**

```bash
# Install all configured rules
npx rules-manager install

# Install a specific rule from configuration
npx rules-manager install eslint-standard

# Install a rule directly from a URL and update configuration
npx rules-manager install eslint-standard https://example.com/rules/eslint.mdc

# Install a rule directly from a local file and update configuration
npx rules-manager install project-rules ./rules/custom.mdc

# Install a rule from an npm package and update configuration
npx rules-manager install react-best-practices @company/rules-manager-react
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Development

### Testing

The project includes both unit tests and end-to-end (E2E) tests:

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only E2E tests
npm run test:e2e
```

## License

MIT
