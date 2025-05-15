# E2E Tests

The e2e tests basically test the CLI by running it with different configurations and asserting the output. To create the initial state of each test, we use fixtures.

## Using Fixtures in Tests

All E2E test fixtures are located in the `tests/fixtures` directory.
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
tests/fixtures/e2e/list-with-multiple-rules/
├── aicm.json  # Config with multiple rules
└── rules/
    ├── rule1.mdc
    └── rule3.mdc
```

# E2E Testing Guidelines

## Key Principles

1. **Always use fixtures for test state**

   - Store initial test state in the `tests/fixtures` directory
   - Create a dedicated fixture directory for each test scenario
   - Include `.gitkeep` files in empty fixture directories
   - **Never** create test files on-the-fly with `fs.writeFileSync()` or similar methods

2. **Fixture Directory Structure**

   - Name fixtures descriptively based on test scenario
   - Follow the established pattern in existing fixtures
   - Each fixture should be self-contained and independent

3. **Using Fixtures in Tests**
   - Use `setupFromFixture(fixtureName, testName)` to initialize test state
   - Verify fixture content exists before running tests
   - For empty starting states, use the `init-empty` fixture

## Example

```typescript
// Good practice
test("should do something with files", async () => {
  await setupFromFixture("my-test-fixture", expect.getState().currentTestName);

  // Test logic here
});

// Bad practice - DO NOT DO THIS
test("should not create files directly", async () => {
  await setupTestDir(expect.getState().currentTestName);

  // DON'T DO THIS - violates test standards
  fs.writeFileSync(path.join(testDir, "some-file.txt"), "content");

  // Test logic here
});
```
