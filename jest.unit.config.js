/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/unit/**/*.test.ts"],
  verbose: true,
  clearMocks: true,
  resetMocks: false,
  // No need for long timeouts in unit tests
  testTimeout: 5000,
  setupFilesAfterEnv: ["./tests/setup.ts"],
};
