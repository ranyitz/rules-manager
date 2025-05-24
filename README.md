# 🗂️ aicm

> Agentic IDE Configuration Manager

A CLI tool for syncing and managing Agentic IDE rules across projects

https://github.com/user-attachments/assets/e80dedbc-89c4-4747-9acf-b7ecb7493fcc

## Why

With the rise of Agentic IDEs like cursor and windsurf, we have an opportunity to enforce best practices through rules. However, these rules are typically isolated within individual developers or projects.

**aicm** is a CLI tool for distributing Agentic IDE configurations, rules, and MCPs across projects. It leverages package managers to copy configurations from node_modules to the correct locations in your file system.

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

In your project's `aicm.json`, reference the package and the specific rule:

```json
{
  "rules": {
    "typescript": "@myteam/ai-tools/rules/typescript.mdc",
    "react": "@myteam/ai-tools/rules/react.mdc"
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

Now the rules will be linked to `.cursor/rules/aicm/` when you run `npm install`.

### Using Presets

Presets allow you to bundle multiple rules & mcps into a single configuration that can be shared across projects.

1. **Create a preset package or directory**

Create an npm package with your rule definitions in an `aicm.json` file:

> `@myteam/ai-tools/aicm.json`

```json
{
  "rules": {
    "typescript": "./rules/typescript.mdc",
    "react": "./rules/react.mdc"
  },
  "mcpServers": {
    "my-mcp": {
      "url": "https://example.com/sse"
    }
  }
}
```

2. **Reference the preset in your project**

In your project's `aicm.json`, reference the preset by its npm package or directory name:

```json
{
  "presets": ["@myteam/ai-tools"]
}
```

When you run `npx aicm install`, all rules from the preset will be installed to `.cursor/rules/aicm/` and all mcps from the preset will be installed to `.cursor/mcp.json`.

### Notes

- Generated rules are always placed in a subdirectory for deterministic cleanup and easy gitignore.
- Users may add `.cursor/rules/aicm/` and `.aicm/` (for Windsurf) to their `.gitignore` if they do not want to track generated rules.

### Overriding and Disabling Rules and MCP Servers from Presets

When you use a preset, you can override or disable any rule or mcpServer from the preset in your own `aicm.json` configuration:

- **Override**: To override a rule or mcpServer, specify the same key in your config with a new value. The value in your config will take precedence over the preset.
- **Disable**: To disable a rule or mcpServer from a preset, set its value to `false` in your config.

**Example:**

```json
{
  "ides": ["cursor"],
  "presets": ["@company/ai-rules/aicm.json"],
  "rules": {
    "rule-from-preset-a": "./rules/override-rule.mdc",
    "rule-from-preset-b": false
  },
  "mcpServers": {
    "mcp-from-preset-a": {
      "command": "./scripts/override-mcp.sh",
      "env": { "MCP_TOKEN": "override" }
    },
    "mcp-from-preset-b": false
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

To enable workspaces mode, use the `--workspaces` flag:

```bash
npx aicm install --workspaces
```

This will:

1. **Discover packages**: Automatically find all directories containing `aicm.json` files in your repository
2. **Install per package**: Install rules and MCPs for each package individually in their respective directories

### How It Works

Each directory containing an `aicm.json` file is treated as a separate package with its own configuration.

For example, in a workspace structure like:

```
├── packages/
│   ├── frontend/
│   │   └── aicm.json
│   └── backend/
│       └── aicm.json
└── services/
    └── api/
        └── aicm.json
```

Running `npx aicm install --workspaces` will install rules for each package in their respective directories:

- `packages/frontend/.cursor/rules/aicm/`
- `packages/backend/.cursor/rules/aicm/`
- `services/api/.cursor/rules/aicm/`

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
    "team-rules/team-standards": "@my-team/ai-tools/rules/team-standards.mdc"
  },
  "mcpServers": {
    "remote-mcp": {
      "url": "https://example.com/sse"
    }
  }
}
```

- **ides**: Array of IDE names where rules should be installed. Currently supported values:

  - `"cursor"`: For the Cursor IDE
  - `"windsurf"`: For the Windsurf IDE

  > **Note:** The 'ides' field is default to `["cursor"]` if not specified.

- **rules**: Object containing rule configurations

  - **rule-name**: A unique identifier for the rule. Can include a directory path to install the rule to a specific directory.
  - **source-location**: Location of the rule file (path within an npm package or local path)

- **mcpServers**: Object containing MCP server configurations. Each key is a unique server name, and the value is an object with either:

  - **command**: The command or script to run (with optional **args** and **env**), or
  - **url**: The URL to fetch the MCP config from (with optional **env**)

- **presets**: Array of preset configurations to include. Each preset is a path to a JSON file (npm package or local path) that contains additional rules and mcpServers.

  - Preset files should contain a `rules` and `mcpServers` objects with the same structure as the main configuration.

- **installOnCI**: Boolean flag (default: `false`) that controls whether installation should proceed in CI environments. When set to `true`, rules will be installed even in CI environments.

### MCP Server Installation

- **Cursor**: MCP server configs are written to `.cursor/mcp.json` (see Cursor docs for latest path).
- **Windsurf**: Windsurf does not support project mcpServers. MCP server configuration is not installed for Windsurf projects.

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

- **Cursor**: Rules are installed as individual `.mdc` files in the Cursor rules directory (`.cursor/rules/aicm/`), mcp servers are installed to `.cursor/mcp.json`
- **Windsurf**: Rules are installed in the `.aicm` directory which should be added to your `.gitignore` file. Our approach for Windsurf is to create links from the `.windsurfrules` file to the respective rules in the `.aicm` directory. There is no support for local mcp servers at the moment.

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

Installs all rules and MCPs configured in your `aicm.json`.

```bash
npx aicm install
```

Options:

- `--ci`: run in CI environments (default: `false`)
- `--workspaces`: enable workspaces mode to discover and install configurations across multiple packages
- `--verbose`: show detailed output during installation

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
    react: "@org/rules/react.mdc",
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
- `workspaces`: Enable workspaces mode (default: `false`)
- `verbose`: Show verbose output during installation (default: `false`)

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
