import path from "path";
import { rimraf } from "rimraf";

// Define the path to the tmp-test-v2 directory
const projectRoot = path.resolve(__dirname, "../../");
const tmpTestDir = path.join(projectRoot, "tmp-test-v2");

/**
 * Global setup function that runs before any tests
 * Cleans up the entire tmp-test-v2 directory
 */
export default async function globalSetup() {
  console.log("🧹 Cleaning up tmp-test-v2 directory before running tests...");

  try {
    // Remove the entire tmp-test-v2 directory
    await rimraf(tmpTestDir);
  } catch (error) {
    console.error("❌ Error cleaning up tmp-test-v2 directory:", error);
  }
}
