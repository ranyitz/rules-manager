# Monorepo Support Feature - Product Requirements Document (PRD)

## 📋 Overview

### **Feature Name**: Monorepo Support for AICM

### **Version**: 1.0

### **Status**: Draft

## 🎯 Executive Summary

This PRD outlines the design and implementation of monorepo support for the AICM (Agentic IDE Configuration Manager) tool. The feature will enable users to manage AI IDE configurations across multiple packages/modules within a monorepo structure using a single command, eliminating the need to manually install configurations for each subproject.

## 🔍 Problem Statement

### Current Pain Points

1. **Manual Installation**: Users must run `aicm install` separately in each package/module within a monorepo
2. **Configuration Drift**: Different packages may have inconsistent AI IDE configurations
3. **Developer Experience**: Poor DX when working with large monorepos containing many packages
4. **CI/CD Complexity**: Multiple installation steps required in CI/CD pipelines for monorepo projects

### Target Users

- **Frontend Teams** using npm-based monorepos (Yarn Workspaces, Lerna, Turborepo, Nx)
- **Backend Teams** using Bazel or other build systems
- **Full-stack Teams** with mixed language monorepos
- **DevOps Engineers** setting up CI/CD for monorepo projects

## 🎯 Goals & Success Criteria

### Primary Goals

1. **Single Command Installation**: Enable `aicm install --monorepo` to install configurations for all packages
2. **Auto-Discovery**: Automatically detect all packages with aicm configurations in a monorepo
3. **Cross-Platform Support**: Work with npm-based monorepos and backend monorepos (Bazel)
4. **Backwards Compatibility**: Maintain full compatibility with existing single-package functionality

### Success Metrics

- ✅ Zero breaking changes to existing API
- ✅ Support for 95% of common monorepo structures
- ✅ Installation time improvement of 80% for monorepos with 10+ packages
- ✅ 100% test coverage for monorepo scenarios

## 🛠️ Technical Requirements

### Discovery Algorithm

The monorepo discovery will use a heuristic-based approach:

1. **Recursive Search**: Find all `aicm.json` files starting from the command execution directory using glob pattern (use https://github.com/sindresorhus/globby)
2. **Package Root Detection**: A directory containing `aicm.json` is considered a "package root" if it also contains:
   - `package.json` (for npm-based packages)
   - `build.bazel` or `BUILD` (for Bazel packages)
   - Other build files as needed (future extensibility)

### Command Line Interface

#### New Flag

```bash
aicm install --monorepo
```

#### Options

- `--monorepo`: Enable monorepo mode

#### Examples

```bash
# Basic monorepo installation
aicm install --monorepo

```

### Configuration Extension

#### Root Configuration

Can also include monorepo: true, in which case the install command will work as if --monorepo was passed.

```json
{
  "monorepo": true,
  "ides": ["cursor"],
  "rules": {
    "global-rules": "./global-rules/shared.mdc"
  }
}
```

#### Package-Level Configuration

Each package maintains its own `aicm.json`:

```json
{
  "ides": ["cursor", "windsurf"],
  "rules": {
    "package-specific": "./rules/react-component.mdc"
  },
  "presets": ["@company/frontend-preset"]
}
```

### API Extensions

#### New Types

```typescript
export interface Config {
  monorepo?: boolean = false
}

export interface MonorepoInstallResult extends InstallResult {
  packages: Array<{
    path: string;
    success: boolean;
    error?: string;
    installedRuleCount: number;
  }>;
}
```

#### New Functions

```typescript
export async function discoverPackagesWithAicm(
  rootDir: string,
  options?: DiscoveryOptions,
): Promise<PackageInfo[]>;

export async function installMonorepo(
  options?: InstallOptions & { monorepoOptions?: DiscoveryOptions },
): Promise<MonorepoInstallResult>;
```

### Implementation Architecture

#### Directory Structure

```
src/
├── commands/
│   ├── install.ts           # Extended with --monorepo flag
│   └── monorepo/            # New monorepo-specific logic
│       ├── discovery.ts     # Package discovery logic
│       ├── installer.ts     # Parallel/sequential installation
│       └── types.ts         # Monorepo-specific types
└── utils/
    └── package-detector.ts  # Detect package types (npm/bazel)
```

#### Core Components

1. **Package Discovery (`discovery.ts`)**

   ```typescript
   export async function discoverPackages(
     rootDir: string,
     options: MonorepoDiscoveryOptions = {},
   ): Promise<PackageInfo[]>;
   ```

2. **Package Type Detection (`package-detector.ts`)**

   ```typescript
   export function detectPackageType(
     packageDir: string,
   ): "npm" | "bazel" | "unknown";
   ```

3. **Monorepo Installer (`installer.ts`)**
   ```typescript
   export async function installMonorepoPackages(
     packages: PackageInfo[],
     options: InstallOptions,
   ): Promise<MonorepoInstallResult>;
   ```

## 🧪 Testing Strategy

### E2E Tests (Following aicm testing patterns)

- **Fixture-based Tests**: Store test monorepo structures in `tests/fixtures/monorepo-*`
- **Test Scenarios**:
  - `monorepo-npm-basic/`: Simple npm workspace with 2-3 packages
  - `monorepo-npm-nested/`: Deeply nested npm workspace structure
  - `monorepo-bazel-basic/`: Simple Bazel monorepo
  - `monorepo-mixed/`: Mixed npm + Bazel packages
  - `monorepo-no-configs/`: Monorepo with no aicm configurations
  - `monorepo-partial-configs/`: Some packages with configs, some without
  - `monorepo-error-scenarios/`: Invalid configurations and error handling

## 🚀 Implementation Phases

### Phase 1: Core Discovery

- ✅ Implement package discovery algorithm
- ✅ Add package type detection
- ✅ Basic monorepo configuration support
- ✅ Unit tests for discovery logic

### Phase 2: Installation Engine (Week 3-4)

- ✅ Error handling and continuation logic
- ✅ CLI integration with `--monorepo` flag
- ✅ Basic E2E tests

### Phase 3: Advanced Features (Week 5-6)

- ✅ Pattern matching (include/exclude)
- ✅ Configuration inheritance
- ✅ Performance optimizations
- ✅ Comprehensive E2E test suite

### Phase 4: Documentation & Polish (Week 7-8)

- ✅ Updated README with monorepo examples
- ✅ CLI help text updates
- ✅ Error message improvements
- ✅ Performance benchmarking

## 🔄 User Experience Flow

### Happy Path

1. **User runs**: `cd my-monorepo && aicm install --monorepo`
2. **System discovers**: All packages with aicm.json configurations
3. **System installs**: Configurations in parallel for all packages
4. **User sees**: Progress updates and final summary

### Example Output

```bash
$ aicm install --monorepo

🔍 Discovering packages...
Found 5 packages with aicm configurations:
  - packages/frontend-app (npm)
  - packages/backend-api (npm)
  - packages/shared-lib (npm)
  - tools/build-scripts (bazel)
  - services/data-processor (bazel)

📦 Installing configurations...
✅ packages/frontend-app (3 rules)
✅ packages/backend-api (2 rules, 1 MCP)
✅ packages/shared-lib (1 rule)
✅ tools/build-scripts (4 rules)
✅ services/data-processor (2 rules)

🎉 Successfully installed 12 rules and 1 MCP server across 5 packages
```

### Error Scenarios

```bash
$ aicm install --monorepo

🔍 Discovering packages...
Found 3 packages with aicm configurations

📦 Installing configurations...
✅ packages/frontend-app (3 rules)
❌ packages/backend-api: Rule file not found: ./rules/missing.mdc
✅ packages/shared-lib (1 rule)

⚠️  Installation completed with errors
Successfully installed: 2/3 packages (4 rules total)
Failed packages: packages/backend-api

Run with --continue-on-error to install other packages despite failures.
```

### Configuration Validation

- Validate all discovered aicm.json files before processing
- Prevent execution of arbitrary commands in parallel processes
- Maintain existing security restrictions for rule sources

## 📊 Performance Considerations

### Optimization Strategies

1. **Parallel Processing**: Install packages concurrently by default
2. **Caching**: Cache package discovery results for subsequent runs
3. **Lazy Loading**: Only load configurations for packages being processed

## 🤝 Backward Compatibility

### Existing Functionality

- ✅ All existing CLI commands work unchanged
- ✅ All existing configurations remain valid
- ✅ Node.js API maintains same interface
- ✅ No breaking changes to core types

## 📋 Acceptance Criteria

### Must Have

- [ ] `aicm install --monorepo` command works with npm workspaces
- [ ] `aicm install --monorepo` command works with Bazel monorepos
- [ ] Automatic package discovery with configurable depth
- [ ] Parallel installation support
- [ ] Error handling with continue-on-error option
- [ ] 100% backward compatibility
- [ ] Comprehensive E2E test coverage

### Should Have

- [ ] Detailed progress reporting

### Could Have

- [ ] Caching for repeated runs
- [ ] Visual progress indicators
