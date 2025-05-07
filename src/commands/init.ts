import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

const defaultConfig = {
  ides: ["cursor"],
  rules: {},
};

export function initCommand(): void {
  const configPath = path.join(process.cwd(), "aicm.json");

  if (fs.existsSync(configPath)) {
    console.log(chalk.yellow("Configuration file already exists!"));
    return;
  }

  try {
    fs.writeJsonSync(configPath, defaultConfig, { spaces: 2 });
    console.log(chalk.green("Configuration file created successfully!"));
    console.log(`Configuration file location: ${chalk.blue(configPath)}`);
    console.log(`\nNext steps:`);
    console.log(`  1. Edit ${chalk.blue("aicm.json")} to configure your rules`);
    console.log(`  2. Run ${chalk.blue("npx aicm install")} to install rules`);
  } catch (error) {
    console.error(chalk.red("Error creating configuration file:"), error);
  }
}
