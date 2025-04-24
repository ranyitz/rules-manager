import path from "path";
import { rimraf } from "rimraf";

// Define the path to the tmp-test directory
const projectRoot = path.resolve(__dirname, "../../");
const tmpTestDir = path.join(projectRoot, "tmp-test");

/**
 * Global setup function that runs before any tests
 * Cleans up the entire tmp-test directory
 */
export default async function globalSetup() {
  console.log("🧹 Cleaning up tmp-test directory before running tests...");

  try {
    // Remove the entire tmp-test directory
    await rimraf(tmpTestDir);
    console.log("✅ tmp-test directory cleanup complete!");
  } catch (error) {
    console.error("❌ Error cleaning up tmp-test directory:", error);
  }
}
