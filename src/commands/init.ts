import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import arg from "arg";

// Default configuration
const defaultConfig = {
  ides: ["cursor"],
  rules: {},
};

export function initCommand(): void {
  // Parse command-specific arguments
  const args = arg(
    {
      // Removed the --force flag
    },
    {
      permissive: true,
      argv: process.argv.slice(3), // Skip the first two args and the command name
    }
  );

  const configPath = path.join(process.cwd(), "rules-manager.json");

  // Check if config file already exists
  if (fs.existsSync(configPath)) {
    console.log(chalk.yellow("Configuration file already exists!"));
    return;
  }

  try {
    // Create config file
    fs.writeJsonSync(configPath, defaultConfig, { spaces: 2 });
    console.log(chalk.green("Configuration file created successfully!"));
    console.log(`Configuration file location: ${chalk.blue(configPath)}`);
    console.log(`\nNext steps:`);
    console.log(
      `  1. Edit ${chalk.blue("rules-manager.json")} to configure your rules`
    );
    console.log(
      `  2. Run ${chalk.blue("npx rules-manager install")} to install rules`
    );
  } catch (error) {
    console.error(chalk.red("Error creating configuration file:"), error);
  }
}
