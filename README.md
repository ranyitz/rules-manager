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

# 2. Quick setup - copy and paste this one-liner to update your config
npx ai-rules init

# 3. Copy and paste this to the terminal to update your config manually
echo '{
  "ides": ["cursor"],
  "rules": {
    "pirate-coding": "https://gist.githubusercontent.com/ranyitz/043183278d5ec0cbc65ebf24a9ee57bd/raw/b4ec0c74c6f9aec3054a7ef7a6821bc94c84fe74/pirate-coding-rule.mdc"
  }
}' > ai-rules.json

# 4. Install the rule
npx ai-rules install
```

After installation, open Cursor and ask for coding help. Your AI assistant will respond with pirate-themed coding advice.

## Commands

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

## Configuration

ai-rules uses a JSON configuration file (`ai-rules.json`) in your project directory.

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

- **ides**: Array of IDE names where rules should be installed
- **rules**: Object containing rule configurations
  - **rule-name**: A unique identifier for the rule
  - **source-location**: Location of the rule file (URL, npm package name, or local path)

### Rule Source Types

The type of rule is automatically detected based on the source format:

#### URL Source

Rules hosted on public URLs (GitHub, Gists, etc.)

```json
"eslint-standard": "https://gist.github.com/user/abc123def456"
```

#### NPM Source

Rules provided by NPM packages

```json
"react-best-practices": "@company/ai-rules-react"
```

#### Local Source

Rules stored locally in your project or filesystem

```json
"personal-rules": "./rules/custom.mdc"
```

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

## Supported IDEs

- **Cursor**: Rules are installed as individual `.mdc` files in the Cursor rules directory
- **Windsurf**: Rules are concatenated into a single `.windsurfrules` file in the Windsurf configuration directory

## Installation Locations

Default installation locations by IDE:

- **Cursor**: `.cursor/rules/` (project-specific directory)
- **Windsurf**: `.windsurf/.windsurfrules` (project-specific directory)

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
