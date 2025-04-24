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

## Getting Started

Here's a quick example to get you started using ai-rules with a pre-configured rule:

```bash
# Step 1: Create a new directory for your project (optional)
mkdir my-ai-rules-project && cd my-ai-rules-project

# Step 2: Initialize a new configuration
npx ai-rules init

# Step 3: Edit the ai-rules.json file to use a ready-made TypeScript best practices rule
cat > ai-rules.json << EOF
{
  "ides": ["cursor", "windsurf"],
  "rules": {
    "typescript-best-practices": {
      "source": "https://gist.githubusercontent.com/ranyitz/3f48ef083921fe81b7963b1f369ea70b/raw/a08d68545bd13c3abc92d6a3c8e9ed87c6ffbf6a/typescript-best-practices.mdc",
      "type": "url"
    }
  }
}
EOF

# Step 4: Install the rule to your IDE
npx ai-rules install

# Step 5: Verify the installation
npx ai-rules list --verbose
```

After running these commands, you'll have a TypeScript best practices rule installed that helps you write better TypeScript code in your IDE.

Try it out by opening a TypeScript file in your IDE and asking for coding assistance!

## More Examples

### Example: Installing Multiple Rules

You can install multiple rules at once by adding them to your configuration file:

```bash
# Initialize a configuration
npx ai-rules init

# Create a configuration with multiple rules
cat > ai-rules.json << EOF
{
  "ides": ["cursor", "windsurf"],
  "rules": {
    "typescript-best-practices": {
      "source": "https://gist.githubusercontent.com/ranyitz/3f48ef083921fe81b7963b1f369ea70b/raw/a08d68545bd13c3abc92d6a3c8e9ed87c6ffbf6a/typescript-best-practices.mdc",
      "type": "url"
    },
    "react-best-practices": {
      "source": "https://gist.githubusercontent.com/ranyitz/29c1d1d0b9c5b3a3ad4d6359b2f2a40e/raw/d0e63c5c0efffca78d2112618c993c5b7b1c2bab/react-best-practices.mdc",
      "type": "url"
    }
  }
}
EOF

# Install all rules
npx ai-rules install
```

This example installs both TypeScript and React best practices rules, allowing your AI assistant to provide better guidance for both technologies.

### Example: Working with Local Rules

You can also use local rule files:

```bash
# Create a rule file
mkdir -p rules
cat > rules/custom-rule.mdc << EOF
# My Custom Rule

When writing code, focus on:
1. Readability
2. Maintainability
3. Performance

Follow these principles whenever providing code suggestions.
EOF

# Add the local rule to your configuration
cat > ai-rules.json << EOF
{
  "ides": ["cursor", "windsurf"],
  "rules": {
    "my-custom-rule": {
      "source": "./rules/custom-rule.mdc",
      "type": "local"
    }
  }
}
EOF

# Install the local rule
npx ai-rules install
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
