# V2 Test Fixtures

This directory contains test fixtures specifically for AICM v2 tests. These fixtures are separate from the v1 fixtures to avoid interference between test suites.

## Available Fixtures

### `install-v2-basic`

Basic v2 configuration with:

- Single rule in `./rules/test-rule-v2.mdc`
- MCP server configuration
- Cursor target

### `no-config-v2`

Empty directory with no configuration file for testing error scenarios.

### `install-v2-multiple-rules`

Configuration with multiple rules:

- `./rules/rule1.mdc`
- `./rules/rule2.mdc`
- `./rules/subdir/rule3.mdc`

### `install-v2-multiple-targets`

Configuration targeting both Cursor and Windsurf IDEs.

### `install-v2-no-mcp`

Configuration without MCP servers, only rules.

### `install-v2-empty-rules`

Configuration with empty rules directory for testing edge cases.

## Usage

These fixtures are used by the v2 test suite in `tests/e2e-v2/` and are automatically loaded by the `setupFromFixture()` helper function.
