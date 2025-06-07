/** @type {import('ts-jest').JestConfigWithTsJest} */

// eslint-disable-next-line no-undef
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/unit/**/*.test.ts"],
  verbose: true,
  clearMocks: true,
  resetMocks: false,
  testTimeout: 5000,
  modulePathIgnorePatterns: ["<rootDir>/tests/fixtures", "<rootDir>/tmp-test"],
  setupFilesAfterEnv: ["./tests/setup.ts"],
};
