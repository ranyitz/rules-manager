import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

// Default configuration template
const defaultConfig = {
  ides: ["cursor", "windsurf"],
  rules: {
    "example-rule": {
      source: "https://example.com/rule.mdc",
      type: "url",
    },
  },
};

export function initCommand(): void {
  const configPath = path.join(process.cwd(), "ai-rules.json");

  // Check if config file already exists
  if (fs.existsSync(configPath)) {
    console.log(chalk.yellow("Configuration file already exists!"));
    console.log(
      chalk.yellow(
        "To overwrite, delete the existing ai-rules.json file first."
      )
    );
    return;
  }

  try {
    // Create config file
    fs.writeJsonSync(configPath, defaultConfig, { spaces: 2 });
    console.log(chalk.green("✓ Configuration file created successfully!"));
    console.log(`Configuration file location: ${chalk.blue(configPath)}`);
    console.log(`\nNext steps:`);
    console.log(
      `  1. Edit ${chalk.blue("ai-rules.json")} to configure your rules`
    );
    console.log(`  2. Run ${chalk.blue("ai-rules install")} to install rules`);
  } catch (error) {
    console.error(chalk.red("Error creating configuration file:"));
    console.error(error);
  }
}
