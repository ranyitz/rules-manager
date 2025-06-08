/**
 * Helper function to execute a function within a specific working directory
 * and ensure the original directory is always restored
 */
export async function withWorkingDirectory<T>(
  targetDir: string,
  fn: () => Promise<T>,
): Promise<T> {
  const originalCwd = process.cwd();
  if (targetDir !== originalCwd) {
    process.chdir(targetDir);
  }

  try {
    return await fn();
  } finally {
    if (targetDir !== originalCwd) {
      process.chdir(originalCwd);
    }
  }
}
