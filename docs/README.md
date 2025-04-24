# ai-rules Documentation

Welcome to the ai-rules documentation! This directory contains detailed information about using and configuring the ai-rules tool.

## Table of Contents

- [Getting Started](#getting-started)
- [Documentation Files](#documentation-files)
- [Examples](#examples)
- [Additional Resources](#additional-resources)

## Getting Started

If you're new to ai-rules, we recommend starting with the following:

1. Check the [main README](../README.md) for an overview of the tool
2. Read the [Commands Reference](commands.md) to understand available commands
3. Review the [Configuration Guide](configuration.md) to learn how to configure the tool

## Documentation Files

- [**commands.md**](commands.md): Detailed information about all available commands, options, and examples
- [**configuration.md**](configuration.md): Comprehensive guide to configuring ai-rules through the ai-rules.json file

## Examples

The following examples demonstrate common use cases for ai-rules:

### Basic Workflow

```bash
# Initialize a new configuration
ai-rules init

# Edit your ai-rules.json file to add rules

# Install rules to your IDEs
ai-rules install

# List your rules and their status
ai-rules list
```

### Using a Single Rule

```bash
# Install a specific rule
ai-rules install my-rule

# Check if the rule was installed correctly
ai-rules list --verbose
```

## Additional Resources

- [GitHub Repository](https://github.com/user/ai-rules): Source code and issue tracking
- [NPM Package](https://www.npmjs.com/package/ai-rules): NPM package information
