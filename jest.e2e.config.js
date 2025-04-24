/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/e2e/**/*.test.ts"],
  verbose: true,
  clearMocks: true,
  resetMocks: false,
  testTimeout: 30000, // Longer timeout for e2e tests
  globalSetup: "<rootDir>/tests/e2e/global-setup.ts", // Add global setup
};
