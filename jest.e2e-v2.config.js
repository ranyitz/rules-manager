/** @type {import('ts-jest').JestConfigWithTsJest} */

// eslint-disable-next-line no-undef
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/e2e-v2/**/*.test.ts"],
  globalSetup: "<rootDir>/tests/e2e-v2/global-setup.ts",
  setupFilesAfterEnv: ["<rootDir>/tests/e2e-v2/setup.ts"],
  testTimeout: 30000,
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/*.test.ts"],
  modulePathIgnorePatterns: [
    "<rootDir>/tests/fixtures-v2",
    "<rootDir>/tmp-test-v2",
  ],
  coverageDirectory: "coverage-e2e-v2",
  coverageReporters: ["text", "lcov", "html"],
};
