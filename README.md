# 📜 rules-manager

A CLI tool for managing AI IDE rules across different projects and teams.

## Overview

rules-manager helps developers manage, share, and synchronize AI assistant rules across different projects and IDEs.

## Features

- Share rules between team repositories
- Maintain consistent AI assistant behavior across projects
- Install rules from multiple sources (URLs, npm packages, local files)
- Keep rules up to date with a remote source

## Installation & Usage

```bash
# Use directly with npx
npx rules-manager <command>

# Or install locally in a project
npm install --save-dev rules-manager
```

## Getting Started

```bash
# 1. Initialize a configuration
npx rules-manager init

# 2. Quick setup - run this in your terminal, or copy and paste it into your rules-manager.json file
echo '{
  "ides": ["cursor"],
  "rules": {
    "pirate-coding": "https://gist.githubusercontent.com/ranyitz/043183278d5ec0cbc65ebf24a9ee57bd/raw/pirate-coding-rule.mdc"
  }
}' > rules-manager.json

# 3. Install the rule
npx rules-manager install
```

After installation, open Cursor and ask for coding help. Your AI assistant will respond with pirate-themed coding advice.

> **Note**: This workflow is fully tested and verified to work with the current version of rules-manager.

## Configuration

rules-manager uses a JSON configuration file (`rules-manager.json`) in your project directory.

### Configuration File Location

By default, rules-manager looks for the `rules-manager.json` file in the current working directory. This allows you to have different configurations for different projects.

### Configuration Structure

```json
{
  "ides": ["cursor"],
  "rules": {
    "rule-name": "source-location"
  }
}
```

### Configuration Fields

- **ides**: Array of IDE names where rules should be installed. Currently supported values:

  - `"cursor"`: For the Cursor IDE

- **rules**: Object containing rule configurations
  - **rule-name**: A unique identifier for the rule
  - **source-location**: Location of the rule file (URL, npm package name, or local path)

### Rule Source Types

The type of rule is automatically detected based on the source format:

#### URL Source

Rules hosted on public URLs (GitHub, Gists, etc.). Any source starting with `http://` or `https://` is detected as a URL.

```json
"eslint-standard": "https://gist.github.com/user/abc123def456"
```

URLs must be direct links to the rule file content. For GitHub repositories, use the "raw" URL format.

#### NPM Source

Rules provided by NPM packages. The package must be installed either globally or in your project's `node_modules`. Sources that start with `@` or don't contain path separators are detected as NPM packages.

```json
"react-best-practices": "@company/rules-manager-react"
```

#### Local Source

Rules stored locally in your project or filesystem. Any path containing slashes or backslashes is detected as a local file path.

```json
"personal-rules": "./rules/custom.mdc"
```

Local paths can be:

- Relative to the configuration file (starting with `./` or `../`)
- Absolute paths (starting with `/`)
- Relative paths without the leading `./`

## Example Configurations

### Basic Configuration

```json
{
  "ides": ["cursor"],
  "rules": {
    "formatting": "https://example.com/rules/formatting.mdc"
  }
}
```

### Multiple Rules Configuration

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

## Supported IDEs

- **Cursor**: Rules are installed as individual `.mdc` files in the Cursor rules directory

## Future Plans

We're planning to expand support to additional IDEs in future releases:

- **Windsurf**: Support for the Windsurf IDE is planned for an upcoming release, which will concatenate rules into a single `.windsurfrules` file.

## Recipes

### Automatic Rule Updates from Gists

You can set up your project for automatic rule updates by leveraging GitHub Gists without commit hashes and npm scripts:

```json
{
  "ides": ["cursor"],
  "rules": {
    "team-standards": "https://gist.githubusercontent.com/username/gistid/raw/team-standards.mdc"
  }
}
```

Note that the URL doesn't include a specific commit hash. This means it will always fetch the latest version of the Gist.

1. **Point to the raw Gist URL without a commit hash**:
   ```
   https://gist.githubusercontent.com/username/gistid/raw/filename.mdc
   ```
2. **Add a postinstall script** to your package.json:

   ```json
   {
     "scripts": {
       "postinstall": "rules-manager install"
     }
   }
   ```

3. **Update your Gist** whenever you need to modify the rules.

With this setup, every time someone runs `npm install` in your project, they'll automatically get the latest version of your rules. This is particularly useful for team environments where you want to ensure everyone is using the same, up-to-date AI assistant configurations.

### NPM Package Rules

You can create, publish, and use dedicated npm packages to distribute AI rules across multiple projects. This is especially useful for organizations that want to maintain consistent AI assistant behavior across teams.

Considering the following npm package:

```
rules-manager-myteam/
├── package.json
└── rules/
    ├── typescript.mdc
    ├── react.mdc
    └── general.mdc
```

1. **Use Rules from an NPM Package**

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

**Options:**

- `--force`: Overwrites existing configuration file if it exists

**Example:**

```bash
# Create a new configuration file
npx rules-manager init

# Force create a new configuration file, overwriting any existing one
npx rules-manager init --force
```

**Behavior:**

1. Checks if `rules-manager.json` exists in the current directory
2. If it exists and `--force` is not provided, shows a message and exits
3. If it doesn't exist or `--force` is provided, creates a new configuration file with default settings
4. Shows a success message with the location of the new configuration file

### `install`

Installs rules from your configuration to the appropriate IDE locations.

```bash
npx rules-manager install [rule-name] [options]
```

**Options:**

- `[rule-name]`: Optional - installs a specific rule instead of all rules

**Examples:**

```bash
# Install all configured rules
npx rules-manager install

# Install a specific rule
npx rules-manager install eslint-standard
```

**Behavior:**

1. Loads the configuration file (`rules-manager.json`) from the current directory
2. For each rule (or the specified rule), determines the source type (URL, NPM, local)
3. Retrieves the rule content based on the source type
4. For each configured IDE:
   - Cursor: Copies the rule file to `.cursor/rules/` with the rule name as the filename
5. Shows installation progress and results for each rule

### `list`

Lists all configured rules and their installation status.

```bash
npx rules-manager list [options]
```

**Options:**

- `--verbose`, `-v`: Shows additional details about each rule

**Examples:**

```bash
# List all rules
npx rules-manager list

# List rules with detailed information
npx rules-manager list --verbose
```

**Behavior:**

1. Loads the configuration file from the current directory
2. Checks the installation status of each rule in the configured IDEs
3. Displays a formatted list of rules with:
   - Rule name
   - Source location
   - Source type
   - Installation status
4. In verbose mode, also shows:
   - List of configured IDEs
   - Installation paths for each IDE (if installed)

**Output Format:**

```
Configured Rules:
──────────────────────────────────────────────────
eslint-standard
  Source: https://gist.github.com/user/abc123def456
  Type: url
  Status: Installed
  IDE: cursor  (only shown in verbose mode)
  Installation Path: .cursor/rules/eslint-standard.mdc  (only shown in verbose mode)
──────────────────────────────────────────────────
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

Unit tests are fast and test individual functions, while E2E tests test the CLI commands in a real environment.

## License

MIT
