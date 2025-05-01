# E2E Test Fixtures

This directory contains fixtures for e2e tests. Each subdirectory represents an initial state for a test.

## Using Fixtures in Tests

To use a fixture in your test, use the `setupFromFixture` function from the helpers:

```typescript
import { setupFromFixture, runCommand } from "./helpers";

describe("my test", () => {
  test("should do something", async () => {
    // Setup the test directory using a fixture
    await setupFromFixture("fixture-name", expect.getState().currentTestName);

    // Run your test...
    const { stdout, stderr, code } = await runCommand("some-command");

    // Assert results...
    expect(code).toBe(0);
  });
});
```

## Fixture Structure

Each fixture directory should contain the complete file structure needed for the test.
For example, a fixture for testing the list command might contain:

```
list-with-multiple-rules/
├── rules.json  # Config with multiple rules
└── rules/
    ├── rule1.mdc
    └── rule3.mdc
```
