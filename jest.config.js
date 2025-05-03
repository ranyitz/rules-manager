/** @type {import('ts-jest').JestConfigWithTsJest} */

// eslint-disable-next-line no-undef
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/e2e/**/*.test.ts", "**/tests/unit/**/*.test.ts"],
  verbose: true,
  clearMocks: true,
  resetMocks: false,
  testTimeout: 30000, // Longer timeout for e2e tests
  globalSetup: "<rootDir>/tests/e2e/global-setup.ts", // Add global setup
  setupFilesAfterEnv: ["./tests/setup.ts"],
};
