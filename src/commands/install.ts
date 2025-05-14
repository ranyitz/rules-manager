import chalk from "chalk";
import { install } from "../api";

export async function installCommand(): Promise<void> {
  try {
    // Use the API function with default options - never use silent mode for CLI
    const result = await install({
      silent: false,
    });

    if (!result.success) {
      console.error(chalk.red(result.error));
      process.exit(1);
    }

    console.log(chalk.green("\nRules installation completed!"));
  } catch (error: unknown) {
    console.error(
      chalk.red(
        `Error during rule installation: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ),
    );
    process.exit(1);
  }
}
