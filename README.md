# ai-rules

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

## Quick Start

```bash
# Initialize a new configuration
npx ai-rules init

# Edit your ai-rules.json file to add rules

# Install rules to your IDEs
npx ai-rules install

# List your rules and their status
npx ai-rules list
```

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
    "rule-name": {
      "source": "source-location",
      "type": "source-type"
    }
  }
}
```

### Configuration Fields

- **ides**: Array of IDE names where rules should be installed
- **rules**: Object containing rule configurations
  - **rule-name**: A unique identifier for the rule
    - **source**: Location of the rule file
    - **type**: Type of source (`url`, `npm`, or `local`)

### Rule Source Types

#### URL Source

Rules hosted on public URLs (GitHub, Gists, etc.)

```json
"eslint-standard": {
  "source": "https://gist.github.com/user/abc123def456",
  "type": "url"
}
```

#### NPM Source

Rules provided by NPM packages

```json
"react-best-practices": {
  "source": "@company/ai-rules-react",
  "type": "npm"
}
```

#### Local Source

Rules stored locally in your project or filesystem

```json
"personal-rules": {
  "source": "./rules/custom.mdc",
  "type": "local"
}
```

## Example Configurations

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

### Multiple Rules Configuration

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

## Supported IDEs

- **Cursor**: Rules are installed as individual `.mdc` files in the Cursor rules directory
- **Windsurf**: Rules are concatenated into a single `.windsurfrules` file in the Windsurf configuration directory

## Installation Locations

Default installation locations by IDE:

- **Cursor**: `~/.cursor/rules/`
- **Windsurf**: `~/.config/windsurf/.windsurfrules`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
