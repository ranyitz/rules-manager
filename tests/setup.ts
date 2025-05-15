import { execSync } from "child_process";

// Extend the Jest timeout for all tests
jest.setTimeout(20000);

// Clean up any test artifacts if needed
beforeAll(() => {
  execSync("npm run build");
});

afterAll(() => {
  // Any global cleanup for all tests can go here
});
