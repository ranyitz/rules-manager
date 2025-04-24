# ai-rules Command Reference

This document provides detailed information about the commands available in the `ai-rules` CLI tool.

## Global Options

These options are available for all commands:

- `--help`, `-h`: Show help information
- `--version`, `-v`: Show version information

## init

The `init` command initializes a new configuration file in your project directory.

### Usage

```bash
npx ai-rules init [options]
```

### Options

- `--force`: Overwrites an existing configuration file if one exists

### Examples

```bash
# Create a new configuration file
npx ai-rules init

# Force create a new configuration file, overwriting any existing one
npx ai-rules init --force
```

### Behavior

1. Checks if `ai-rules.json` exists in the current directory
2. If it exists and `--force` is not provided, shows a message and exits
3. If it doesn't exist or `--force` is provided, creates a new configuration file with default settings
4. Shows a success message with the location of the new configuration file

### Default Configuration

The default configuration includes:

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

## install

The `install` command processes rules from your configuration and installs them to the appropriate IDE locations.

### Usage

```bash
npx ai-rules install [rule-name] [options]
```

### Options

- `[rule-name]`: Optional - specifies a single rule to install instead of all rules

### Examples

```bash
# Install all configured rules
npx ai-rules install

# Install a specific rule
npx ai-rules install eslint-standard
```

### Behavior

1. Loads the configuration file (`ai-rules.json`) from the current directory
2. For each rule (or the specified rule), determines the source type (URL, NPM, local)
3. Retrieves the rule content based on the source type:
   - URL: Downloads the file from the specified URL
   - NPM: Locates the rule file within the installed NPM package
   - Local: Reads the rule file from the specified local path
4. For each configured IDE:
   - Cursor: Copies the rule file to `.cursor/rules/` (project-specific directory) with the rule name as the filename
   - Windsurf: Appends or updates the rule content in `.windsurf/.windsurfrules` (project-specific directory)
5. Shows installation progress and results for each rule

### Error Handling

- If the configuration file doesn't exist, shows an error message
- If a rule's source can't be resolved, shows an error but continues with other rules
- If an IDE's directory can't be accessed, shows an error but continues with other IDEs

## list

The `list` command displays all configured rules and their installation status.

### Usage

```bash
npx ai-rules list [options]
```

### Options

- `--verbose`, `-v`: Shows additional details about each rule, including installation paths

### Examples

```bash
# List all rules with basic information
npx ai-rules list

# List rules with detailed information
npx ai-rules list --verbose
```

### Behavior

1. Loads the configuration file (`ai-rules.json`) from the current directory
2. Checks the installation status of each rule in the configured IDEs
3. Displays a formatted list of rules with:
   - Rule name
   - Source location
   - Source type
   - Installation status (installed or not installed)
4. In verbose mode, also shows:
   - List of configured IDEs
   - Installation paths for each IDE (if installed)

### Output Format

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
