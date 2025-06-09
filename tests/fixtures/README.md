# Test Fixtures

This directory contains test fixtures specifically for AICM tests. These fixtures are separate from the v1 fixtures to avoid interference between test suites.

## Available Fixtures

### `install-basic`

Basic configuration with:

- Single rule in `./rules/test-rule.mdc`
- MCP server configuration
- Cursor target

### `no-config`

Empty directory with no configuration file for testing error scenarios.

### `install-multiple-rules`

Configuration with multiple rules:

- `./rules/rule1.mdc`
- `./rules/rule2.mdc`
- `./rules/subdir/rule3.mdc`

### `install-multiple-targets`

Configuration targeting both Cursor and Windsurf IDEs.

### `install-no-mcp`

Configuration without MCP servers, only rules.

### `install-empty-rules`

Configuration with empty rules directory for testing edge cases.

## Usage

These fixtures are used by the test suite in `tests/e2e/` and are automatically loaded by the `setupFromFixture()` helper function.
