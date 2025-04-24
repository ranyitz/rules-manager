// Global test setup
import fs from "fs-extra";
import path from "path";

// Extend the Jest timeout for all tests
jest.setTimeout(10000);

// Clean up any test artifacts if needed
beforeAll(() => {
  // Any global setup for all tests can go here
});

afterAll(() => {
  // Any global cleanup for all tests can go here
});
