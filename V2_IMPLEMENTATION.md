# AICM V2 Implementation

This document describes the v2 implementation of AICM that runs alongside the regular v1 implementation, the goal is to have a v2 implementation that is fully functional and can be used as a replacement for the v1 implementation.

## Overview

The v2 implementation introduces a new configuration format and installation logic. It includes:

- **New CLI**: `aicm-v2` command with the same interface but using v2 logic
- **New API**: `api_v2.ts` for programmatic access to v2 functionality
- **New Test Suite**: `test:e2e-v2` for testing v2 functionality in isolation
- **New Configuration**: Uses `config_v2.ts` with `rulesDir`, `targets`, and `presets`

## Files Created

### Core Implementation

- `src/bin/aicm_v2.ts` - V2 CLI entry point
- `src/cli_v2.ts` - V2 CLI implementation
- `src/api_v2.ts` - V2 API for programmatic use
- `src/commands/install_new.ts` - V2 install command implementation

### Test Infrastructure

- `jest.e2e-v2.config.js` - Jest configuration for v2 tests
- `tests/e2e-v2/setup.ts` - Test setup file
- `tests/e2e-v2/helpers.ts` - Helper functions for v2 tests
- `tests/e2e-v2/install.test.ts` - CLI tests for v2 install command
- `tests/e2e-v2/api.test.ts` - API tests for v2 install function

### Test Fixtures

- `tests/fixtures/install-v2-basic/` - Basic v2 configuration fixture
  - `aicm.json` - V2 config with `rulesDir`, `targets`, `mcpServers`
  - `rules/test-rule-v2.mdc` - Sample rule file

## Key Differences from V1

### Configuration Format

```json
{
  "rulesDir": "./rules",           // Instead of individual rule mappings
  "targets": ["cursor"],           // Instead of "ides"
  "mcpServers": { ... },          // Same as v1
  "presets": [...],               // Enhanced preset system
  "workspaces": true              // Workspace support
}
```

### Installation Logic

- Automatically discovers `.mdc` files in `rulesDir`
- Uses `targets` array instead of `ides`
- Enhanced preset resolution and merging
- Improved workspace support

## Running V2 Tests

```bash
# Run v2 e2e tests only
pnpm test:e2e-v2

# Run all tests (v1 + v2)
pnpm test:unit && pnpm test:e2e && pnpm test:e2e-v2

# Test v2 CLI manually
pnpm build
node dist/bin/aicm_v2.js --help
node dist/bin/aicm_v2.js install --ci
```

## Usage Examples

### CLI Usage

```bash
# Install using v2 CLI
aicm-v2 install

# Install with verbose output
aicm-v2 install --verbose

# Install in CI environment
aicm-v2 install --ci
```

### API Usage

```typescript
import { install } from "./src/api_v2";

const result = await install({
  cwd: "/path/to/project",
  installOnCI: true,
  verbose: true,
});

if (result.success) {
  console.log(`Installed ${result.installedRuleCount} rules`);
} else {
  console.error(`Error: ${result.error}`);
}
```

## Migration Strategy

1. **Parallel Development**: V2 runs alongside V1 without conflicts
2. **Gradual Testing**: Move tests one by one from v1 to v2 format
3. **Feature Parity**: Ensure v2 has all v1 features before migration
4. **Deprecation Path**: Eventually deprecate v1 in favor of v2

## Test Coverage

The v2 test suite currently covers:

### CLI Tests (`install.test.ts`)

- ✅ Install rules using v2 config format
- ✅ Error handling for missing config
- ✅ Help command display
- ✅ Version command display

### API Tests (`api.test.ts`)

- ✅ Programmatic installation via API
- ✅ Error handling via API

### Integration Points

- ✅ Rule file installation to `.cursor/rules/aicm/`
- ✅ MCP server configuration in `.cursor/mcp.json`
- ✅ Proper error propagation and handling
- ✅ CI environment detection and handling

## Next Steps

1. **Add More Test Cases**: Cover presets, workspaces, multiple targets
2. **Feature Completion**: Ensure all v1 features work in v2
