# 📜 ai-rules

A CLI tool for managing AI IDE rules across different projects and teams.

## Overview

ai-rules helps developers manage, share, and synchronize AI assistant rules across different projects and IDEs. It provides a unified way to maintain consistent AI behaviors across your development environments, making it easier to:

- Share rules between team members
- Maintain consistent AI assistant behavior across projects
- Version control your AI assistant configurations
- Distribute rules from multiple sources

The tool supports rules from multiple sources including public URLs, npm packages, and local files.

## Installation & Usage

ai-rules can be used directly with npx without installing it globally:

```bash
# Use directly with npx
npx ai-rules <command>

# Or install locally in a project if needed
npm install --save-dev ai-rules
```

## Getting Started

```bash
# 1. Initialize a configuration
npx ai-rules init

# 2. Quick setup - run this in your terminal, or copy and paste it into your ai-rules.json file
echo '{
  "ides": ["cursor"],
  "rules": {
    "pirate-coding": "https://gist.githubusercontent.com/ranyitz/043183278d5ec0cbc65ebf24a9ee57bd/raw/pirate-coding-rule.mdc"
  }
}' > ai-rules.json

# 3. Install the rule
npx ai-rules install
```

After installation, open Cursor and ask for coding help. Your AI assistant will respond with pirate-themed coding advice.

> **Note**: This workflow is fully tested and verified to work with the current version of ai-rules.

## Commands

### Global Options

These options are available for all commands:

- `--help`, `-h`: Show help information
- `--version`, `-v`: Show version information

### `init`

Initializes a new configuration file in your current directory.

```bash
npx ai-rules init [options]
```

**Options:**

- `--force`: Overwrites existing configuration file if it exists

**Example:**

```bash
# Create a new configuration file
npx ai-rules init

# Force create a new configuration file, overwriting any existing one
npx ai-rules init --force
```

**Behavior:**

1. Checks if `ai-rules.json` exists in the current directory
2. If it exists and `--force` is not provided, shows a message and exits
3. If it doesn't exist or `--force` is provided, creates a new configuration file with default settings
4. Shows a success message with the location of the new configuration file

**Default Configuration:**

```json
{
  "ides": ["cursor", "windsurf"],
  "rules": {
    "example-rule": {
      "source": "https://example.com/rule.mdc",
      "type": "url"
    }
  }
}
```

### `install`

Installs rules from your configuration to the appropriate IDE locations.

```bash
npx ai-rules install [rule-name] [options]
```

**Options:**

- `[rule-name]`: Optional - installs a specific rule instead of all rules

**Examples:**

```bash
# Install all configured rules
npx ai-rules install

# Install a specific rule
npx ai-rules install eslint-standard
```

**Behavior:**

1. Loads the configuration file (`ai-rules.json`) from the current directory
2. For each rule (or the specified rule), determines the source type (URL, NPM, local)
3. Retrieves the rule content based on the source type
4. For each configured IDE:
   - Cursor: Copies the rule file to `.cursor/rules/` with the rule name as the filename
   - Windsurf: Appends or updates the rule content in `.windsurf/.windsurfrules`
5. Shows installation progress and results for each rule

### `list`

Lists all configured rules and their installation status.

```bash
npx ai-rules list [options]
```

**Options:**

- `--verbose`, `-v`: Shows additional details about each rule

**Examples:**

```bash
# List all rules
npx ai-rules list

# List rules with detailed information
npx ai-rules list --verbose
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
  IDE: cursor, windsurf  (only shown in verbose mode)
  Installation Path: .cursor/rules/eslint-standard.mdc  (only shown in verbose mode)
──────────────────────────────────────────────────
```

## Configuration

ai-rules uses a JSON configuration file (`ai-rules.json`) in your project directory.

### Configuration File Location

By default, ai-rules looks for the `ai-rules.json` file in the current working directory. This allows you to have different configurations for different projects.

### Configuration Structure

```json
{
  "ides": ["cursor", "windsurf"],
  "rules": {
    "rule-name": "source-location"
  }
}
```

### Configuration Fields

- **ides**: Array of IDE names where rules should be installed. Currently supported values:

  - `"cursor"`: For the Cursor IDE
  - `"windsurf"`: For the Windsurf IDE

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
"react-best-practices": "@company/ai-rules-react"
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

## Supported IDEs

- **Cursor**: Rules are installed as individual `.mdc` files in the Cursor rules directory
- **Windsurf**: Rules are concatenated into a single `.windsurfrules` file in the Windsurf configuration directory

## Installation Locations

Default installation locations by IDE:

- **Cursor**: `.cursor/rules/` (project-specific directory)
- **Windsurf**: `.windsurf/.windsurfrules` (project-specific directory)

## Best Practices

1. **Use descriptive rule names**: Choose rule names that clearly describe the purpose or content of the rule.
2. **Consider rule priority**: Rules are processed in the order they appear in the configuration. For Windsurf, which concatenates rules, this order matters.
3. **Version control your configuration**: Include your `ai-rules.json` in version control to share consistent rules with your team.
4. **Use NPM packages for team standards**: For team or organization-wide rules, consider distributing them as an NPM package.
5. **Document your rules**: Include comments in your rule files to explain their purpose and any special considerations.
6. **Keep rules specific and focused**: Create separate rules for different concerns rather than one large rule file.

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
