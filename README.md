# 🗂️ aicm

> Agentic IDE Configuration Manager

A CLI tool for syncing and managing Agentic IDE rules across projects

## Why

Development teams struggle with:

- **Inconsistent Practices**: Developers apply varying standards across projects
- **Knowledge Silos**: Best practices remain trapped in individual projects
- **Change Management**: No efficient way to update and distribute new standards

As developers increasingly adopt AI-powered IDEs like Cursor and Windsurf, we have an opportunity to enforce best practices through rules. However, these rules are typically isolated within individual developers or projects.

**aicm** is a CLI tool that helps with distribution of agentic IDE configurations, rules and mcps:

- 🏛️ **Single Source of Truth**: Define, maintain and version-control all AI IDE rules in one central repository
- 📦 **Seamless Distribution**: Automatically synchronize the latest rules to developers' local projects using npm packages
- 🌐 **Cross-IDE Support**: Supports multiple AI-powered IDEs (Cursor, Windsurf)

## Getting Started

To get automatic rule updates from NPM Packages, you can create, publish, and use dedicated npm packages to distribute AI rules across multiple projects.

Consider the following npm package structure:

```
@myteam/ai-tools
├── package.json
└── rules/
    ├── typescript.mdc
    ├── react.mdc
    └── general.mdc
```

1. **Point to the path within the npm package**

In your project's `aicm.json`, reference the package and the specific rule:

```json
{
  "ides": ["cursor"],
  "rules": {
    "typescript": "@myteam/ai-tools/rules/typescript.mdc",
    "react": "@myteam/ai-tools/rules/react.mdc",
    "general": "@myteam/ai-tools/rules/general.mdc"
  }
}
```

2. **Add a postinstall script** to your `package.json`:

```json
{
  "scripts": {
    "postinstall": "npx -y aicm install"
  }
}
```

Now the rules will be linked to `.cursor/rules/` when you run `npm install`.

### Using Presets

Presets allow you to bundle multiple rules into a single configuration that can be shared across projects.

1. **Create a preset file**

Create a JSON file with your rule definitions:

```json
{
  "rules": {
    "typescript": "./rules/typescript.mdc",
    "react": "./rules/react.mdc"
  }
}
```

2. **Reference the preset in your project**

In your project's `aicm.json`, reference the preset:

```json
{
  "ides": ["cursor"],
  "presets": ["@myteam/ai-tools/my-aicm.json"]
}
```

When you run `npx aicm install`, all rules from the preset will be installed to `.cursor/rules/`.

### Demo

Here is a package to demonstrate how aicm works:

```bash
# Install a package containing a rule
npm install --save-dev pirate-coding-rule

# Install the rule via the aicm CLI
npx -y aicm install pirate-coding pirate-coding-rule/rule.mdc
```

This command will:

1. Create a `aicm.json` file if it doesn't exist
2. Add the rule to the configuration
3. Install the rule to `.cursor/rules/`

After installation, open Cursor and ask it to do something. Your AI assistant will respond with pirate-themed coding advice.

## Security Note

To prevent [prompt-injection](https://en.wikipedia.org/wiki/Prompt_injection), use only packages from trusted sources.

## Configuration

To configure aicm, use either:

- a root-level `aicm.json` file, **or**
- an `aicm` key in your project's `package.json`.

Example `aicm.json`:

```json
{
  "ides": ["cursor"],
  "presets": ["@my-team/ai-tools/my-aicm.json"],
  "rules": {
    "team-standards": "@my-team/ai-tools/rules/team-standards.mdc"
  },
  "mcpServers": {
    "remote-mcp": {
      "url": "https://example.com/mcp-config.json"
    }
  }
}
```

- **ides**: Array of IDE names where rules should be installed. Currently supported values:

  - `"cursor"`: For the Cursor IDE

- **rules**: Object containing rule configurations

  - **rule-name**: A unique identifier for the rule
  - **source-location**: Location of the rule file (path within an npm package or local path)

- **mcpServers**: Object containing MCP server configurations. Each key is a unique server name, and the value is an object with either:

  - **command**: The command or script to run (with optional **args** and **env**), or
  - **url**: The URL to fetch the MCP config from (with optional **env**)

- **presets**: Array of preset configurations to include. Each preset is a path to a JSON file (npm package or local path) that contains additional rules and mcpServers.

  - Preset files should contain a `rules` and `mcpServers` objects with the same structure as the main configuration.

### MCP Server Installation

- **Cursor**: MCP server configs are written to `.cursor/mcp.json` (see Cursor docs for latest path).
- **Windsurf**: Windsurf does not support project mcpServers. MCP server configuration is not installed for Windsurf projects.
- All installations are per-project.

### Rule Source Types

The type of rule is automatically detected based on the source format:

#### NPM Source

Rules provided by NPM packages. The package must be installed either globally or in your project's `node_modules`. Sources that start with `@` or don't contain start with path separators are detected as NPM packages.

```json
"react-best-practices": "@my-team/ai-tools/aicm-react"
```

#### Local Source

Rules stored locally in your project or filesystem. Any path containing slashes or backslashes is detected as a local file path.

```json
"personal-rules": "./rules/custom.mdc"
```

## Supported IDEs

- **Cursor**: Rules are installed as individual `.mdc` files in the Cursor rules directory (`.cursor/rules/`), mcp servers are installed to `.cursor/mcp.json`
- **Windsurf**: Rules are installed in the `.rules` directory which should be added to your `.gitignore` file. Our approach for Windsurf is to create links from the `.windsurfrules` file to the respective rules in the `.rules` directory. There is no support for local mcp servers at the moment.

## Commands

### Global Options

These options are available for all commands:

- `--help`, `-h`: Show help information
- `--version`, `-v`: Show version information

### `init`

Initializes a new configuration file in your current directory.

```bash
npx aicm init
```

### `install`

Installs rules from your configuration to the appropriate IDE locations.

```bash
npx aicm install [rule-name] [rule-source]
```

**Options:**

- `[rule-name]`: Optional - Name of a specific rule to install instead of all rules
- `[rule-source]`: Optional - Source of the rule (npm package or local path)

**Examples:**

```bash
# Install all configured rules
npx -y aicm install

# Install a rule from an npm package and update configuration
npx -y aicm install react-best-practices @my-team/ai-tools/react-best-practices.mdc
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
