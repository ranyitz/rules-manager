import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import arg from "arg";

// Default configuration template
const defaultConfig = {
  ides: ["cursor", "windsurf"],
  rules: {
    "example-rule": "https://example.com/rule.mdc",
  },
};

export function initCommand(): void {
  // Parse command-specific arguments
  const args = arg(
    {
      "--force": Boolean,
      "-f": "--force",
    },
    {
      permissive: true,
      argv: process.argv.slice(3), // Skip the first two args and the command name
    }
  );

  const configPath = path.join(process.cwd(), "rules-manager.json");
  const forceOverwrite = args["--force"] || false;

  // Check if config file already exists
  if (fs.existsSync(configPath) && !forceOverwrite) {
    console.log(chalk.yellow("Configuration file already exists!"));
    console.log(
      chalk.yellow(
        "Use --force flag to overwrite the existing rules-manager.json file."
      )
    );
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
      `  2. Run ${chalk.blue("rules-manager install")} to install rules`
    );
  } catch (error) {
    console.error(chalk.red("Error creating configuration file:"), error);
  }
}
