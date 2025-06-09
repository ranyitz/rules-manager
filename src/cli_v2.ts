#!/usr/bin/env node

import arg from "arg";
import chalk from "chalk";
import { initCommand } from "./commands/init";
import { installCommand } from "./commands/install_v2";
import { listCommand } from "./commands/list";

// Define version from package.json
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require("../package.json");

export async function runCliV2() {
  const args = arg(
    {
      "--help": Boolean,
      "--version": Boolean,
      "--ci": Boolean,
      "--verbose": Boolean,
      "-h": "--help",
      "-v": "--version",
    },
    {
      permissive: true,
      argv: process.argv.slice(2),
    },
  );

  // Show version
  if (args["--version"]) {
    console.log(pkg.version);
    process.exit(0);
  }

  // Show help
  if (args["--help"]) {
    showHelp();
    process.exit(0);
  }

  const command = args._.length > 0 ? args._[0] : null;

  try {
    switch (command) {
      case "init":
        initCommand();
        break;
      case "install":
        await installCommand(args["--ci"], args["--verbose"]);
        break;
      case "list":
        await listCommand();
        break;
      default:
        showHelp();
        break;
    }
  } catch (error: unknown) {
    logError(error, args["--verbose"]);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
${chalk.bold("aicm v2")} - A CLI tool for managing AI IDE configurations (v2)

${chalk.bold("USAGE")}
  $ aicm-v2 [command] [options]

${chalk.bold("COMMANDS")}
  init                Initialize a new aicm configuration file
  install             Install rules from configured sources
  list                List all configured rules and their status

${chalk.bold("OPTIONS")}
  -h, --help          Show this help message
  -v, --version       Show version number
  --ci                Run in CI environments (default: \`false\`)
  --verbose           Show detailed output and stack traces for debugging

${chalk.bold("EXAMPLES")}
  $ aicm-v2 init
  $ aicm-v2 install
  $ aicm-v2 list
`);
}

function logError(error: unknown, verbose?: boolean) {
  if (error instanceof Error) {
    console.error(chalk.red(`Error: ${error.message}`));
    if (verbose && error.stack) {
      console.error(chalk.gray(error.stack));
    }
  } else {
    console.error(chalk.red(`Error: ${String(error)}`));
  }
}
