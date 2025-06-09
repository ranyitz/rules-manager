# 🗂️ aicm

> Agentic IDE Configuration Manager

A CLI tool for managing Agentic IDE configurations across projects

![aicm](https://github.com/user-attachments/assets/ca38f2d6-ece6-43ad-a127-6f4fce8b2a5a)

## Why

With the rise of Agentic IDEs, we have an opportunity to enforce best practices through rules. However, these rules are typically isolated within individual projects.
**aicm** is a CLI tool for distributing Agentic IDE configurations, rules, and MCPs across projects. It leverages node package managers, copy configurations from node_modules to the correct locations in your file system.

## Getting Started

Since aicm is not a package manager, begin by creating an npm package that contains your rules and MCP configurations.

Consider the following npm package structure:

```
@myteam/ai-tools
├── package.json
└── rules/
    ├── typescript.mdc
    └── react.mdc
```

1. **Point to the path within the npm package**

In your project's `aicm.json` point to your rule directory and optional presets:

```json
{
  "rulesDir": "./rules",
  "presets": ["@myteam/ai-tools"],
  "mcpServers": {
    "my-mcp": { "url": "https://example.com/sse" }
  }
}
```

2. **Add a prepare script** to your `package.json`:

```json
{
  "scripts": {
    "prepare": "npx -y aicm install"
  }
}
```

Now, when you run `npm install`, the rules will be added to `.cursor/rules/aicm/` and the mcps to `.cursor/mcp.json`.

### Using Presets

Presets allow you to bundle multiple rules and MCP servers into a reusable package.

1. **Create a preset package** with its own `aicm.json`:

```json
{
  "rulesDir": "./rules",
  "mcpServers": { "my-mcp": { "url": "https://example.com/sse" } }
}
```

2. **Reference the preset in your project's `aicm.json`**:

```json
{ "presets": ["@myteam/ai-tools"] }
```

Running `npx aicm install` will install all rules & mcp configurations from the preset to your local project.

### Notes

- Generated rules are always placed in a subdirectory for deterministic cleanup and easy gitignore.
- Users may add `.cursor/rules/aicm/` and `.aicm/` (for Windsurf/Codex) to their `.gitignore` if they do not want to track generated rules.

### Overrides

You can disable or replace specific rules provided by presets using the `overrides` field:

```json
{
  "presets": ["@company/ai-rules"],
  "overrides": {
    "rule-from-preset-a": "./rules/override-rule.mdc",
    "rule-from-preset-b": false
  }
}
```

### Demo

We'll install [an npm package](https://github.com/ranyitz/pirate-coding) containing a simple preset to demonstrate how aicm works.

1. Install an npm package containing a preset

```bash
npm install --save-dev pirate-coding
```

2. Create an `aicm.json` file in your project

```bash
echo '{ "presets": ["pirate-coding"] }' > aicm.json
```

3. Install all rules & mcps from your configuration

```bash
npx -y aicm install
```

This command installs all configured rules and MCPs to their IDE-specific locations.

After installation, open Cursor and ask it to do something. Your AI assistant will respond with pirate-themed coding advice. You can also ask it about the aicm library which uses https://gitmcp.io/ to give you advise based on the latest documentation.

## Security Note

To prevent [prompt-injection](https://en.wikipedia.org/wiki/Prompt_injection), use only packages from trusted sources.

## Workspaces Support

aicm supports workspaces by automatically discovering and installing configurations across multiple packages in your repository.

To enable workspaces mode, set the `workspaces` property to `true` in your root `aicm.json`:

```json
{
  "workspaces": true
}
```

This will:

1. **Discover packages**: Automatically find all directories containing `aicm.json` files in your repository
2. **Install per package**: Install rules and MCPs for each package individually in their respective directories

### How It Works

Each directory containing an `aicm.json` file is treated as a separate package with its own configuration.

For example, in a workspace structure like:

```
├── aicm.json (with "workspaces": true)
├── packages/
│   ├── frontend/
│   │   └── aicm.json
│   └── backend/
│       └── aicm.json
└── services/
    └── api/
        └── aicm.json
```

Running `npx aicm install` will install rules for each package in their respective directories:

- `packages/frontend/.cursor/rules/aicm/`
- `packages/backend/.cursor/rules/aicm/`
- `services/api/.cursor/rules/aicm/`

## Configuration

Create an `aicm.json` file in your project root, or an `aicm` key in your project's `package.json`.

```json
{
  "rulesDir": "./rules",
  "targets": ["cursor"],
  "presets": [],
  "overrides": {},
  "mcpServers": {}
}
```

- **rulesDir**: Directory containing all rule files. Defaults to `"./rules"`.
- **targets**: IDEs/Agent targets where rules should be installed. Defaults to `["cursor"]`.
- **presets**: List of preset packages or paths to include.
- **overrides**: Map of rule names to `false` (disable) or a replacement file path.
- **mcpServers**: MCP server configurations.
- **workspaces**: Set to `true` to enable workspace mode.

### MCP Server Installation

- **Cursor**: MCP server configs are written to `.cursor/mcp.json` (see Cursor docs for latest path).
- **Windsurf**: Windsurf does not support project mcpServers. MCP server configuration is not installed for Windsurf projects.

## Supported IDEs

- **Cursor**: Rules are installed as individual `.mdc` files in the Cursor rules directory (`.cursor/rules/aicm/`), mcp servers are installed to `.cursor/mcp.json`
- **Windsurf**: Rules are installed in the `.aicm` directory which should be added to your `.gitignore` file. Our approach for Windsurf is to create links from the `.windsurfrules` file to the respective rules in the `.aicm` directory. There is no support for local mcp servers at the moment.
- **Codex**: Rules are installed in the `.aicm` directory and referenced from `AGENTS.md` using the same markers as Windsurf.

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

Edit this file to add your rules, presets, or other settings.

### `install`

Installs all rules and MCPs configured in your `aicm.json`.

```bash
npx aicm install
```

Options:

- `--ci`: run in CI environments (default: `false`)
- `--verbose`: show detailed output and stack traces for debugging

## Node.js API

In addition to the CLI, aicm can be used programmatically in Node.js applications:

```javascript
const { install, Config } = require("aicm");

install().then((result) => {
  if (result.success) {
    console.log(`Successfully installed ${result.installedRuleCount} rules`);
  } else {
    console.error(`Error: ${result.error}`);
  }
});

// Install with custom options
const customConfig = {
  ides: ["cursor"],
  rules: {
    typescript: "./rules/typescript.mdc",
    react: "./rules/react.mdc",
  },
};

install({
  config: customConfig,
  cwd: "/path/to/project",
}).then((result) => {
  // Handle result
});
```

### API Reference

#### `install(options?: InstallOptions): Promise<InstallResult>`

Installs rules and MCP servers based on configuration.

**Options:**

- `cwd`: Base directory to use instead of `process.cwd()`
- `config`: Custom config object to use instead of loading from file
- `installOnCI`: Run installation on CI environments (default: `false`)
- `verbose`: Show verbose output and stack traces for debugging (default: `false`)

**Returns:**

A Promise that resolves to an object with:

- `success`: Whether the operation was successful
- `error`: Error message if the operation failed
- `installedRuleCount`: Number of rules installed

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Development

### Testing

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only E2E tests
npm run test:e2e
```

### Publishing

```bash
npm run release
```
