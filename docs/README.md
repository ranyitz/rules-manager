# ai-rules Documentation

Welcome to the ai-rules documentation! This directory contains detailed information about using and configuring the ai-rules tool.

## Table of Contents

- [Getting Started](#getting-started)
- [Getting Started with Examples](#getting-started-with-examples)
- [Documentation Files](#documentation-files)
- [Examples](#examples)
- [Additional Resources](#additional-resources)

## Getting Started

If you're new to ai-rules, we recommend starting with the following:

1. Check the [main README](../README.md) for an overview of the tool
2. Read the [Commands Reference](commands.md) to understand available commands
3. Review the [Configuration Guide](configuration.md) to learn how to configure the tool

## Getting Started with Examples

The fastest way to see ai-rules in action is to try this example which installs a pre-configured rule:

```bash
# Create a test directory (optional)
mkdir ai-rules-test && cd ai-rules-test

# Initialize a new configuration
npx ai-rules init

# Replace the default configuration with one that has a ready-to-use rule
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

# Install the rule to your configured IDEs
npx ai-rules install

# Verify that the rule is installed
npx ai-rules list --verbose
```

### What happens when you run this example?

1. **init**: Creates a basic configuration file with a placeholder rule
2. **cat command**: We replace the default configuration with one that includes a TypeScript best practices rule
3. **install**: Downloads the rule from the provided URL and installs it to your configured IDEs
4. **list**: Shows you the status of the installed rule with detailed information

### Testing the rule

After installing the rule, open a TypeScript file in your IDE (Cursor or Windsurf) and try asking for help with TypeScript code. The AI should now follow the best practices defined in the installed rule.

For example, in Cursor, you could type:

```typescript
// Create a function to process user data
```

Then ask the AI to complete it, and it should follow TypeScript best practices as defined in the rule.

## Documentation Files

- [**commands.md**](commands.md): Detailed information about all available commands, options, and examples
- [**configuration.md**](configuration.md): Comprehensive guide to configuring ai-rules through the ai-rules.json file

## Examples

The following examples demonstrate common use cases for ai-rules:

### Basic Workflow

```bash
# Initialize a new configuration
npx ai-rules init

# Edit your ai-rules.json file to add rules

# Install rules to your IDEs
npx ai-rules install

# List your rules and their status
npx ai-rules list
```

### Using a Single Rule

```bash
# Install a specific rule
npx ai-rules install my-rule

# Check if the rule was installed correctly
npx ai-rules list --verbose
```

## Additional Resources

- [GitHub Repository](https://github.com/user/ai-rules): Source code and issue tracking
- [NPM Package](https://www.npmjs.com/package/ai-rules): NPM package information
