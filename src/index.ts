#!/usr/bin/env node

import arg from "arg";
import chalk from "chalk";
import { initCommand } from "./commands/init";
import { installCommand } from "./commands/install";
import { listCommand } from "./commands/list";

// Define version from package.json
const pkg = require("../package.json");

// Parse arguments
const args = arg(
  {
    "--help": Boolean,
    "--version": Boolean,
    "-h": "--help",
    "-v": "--version",
  },
  {
    permissive: true,
    argv: process.argv.slice(2),
  }
);

// Show version
if (args["--version"]) {
  console.log(pkg.version);
  process.exit(0);
}

// Get the command (first non-flag argument)
const command = args._.length > 0 ? args._[0] : null;
const commandArgs = args._.slice(1);

// Execute the appropriate command
switch (command) {
  case "init":
    initCommand();
    break;
  case "install":
    installCommand();
    break;
  case "list":
    listCommand();
    break;
  default:
    // Show help
    showHelp();
    break;
}

function showHelp() {
  console.log(`
${chalk.bold("rules-manager")} - A CLI tool for managing AI IDE rules

${chalk.bold("USAGE")}
  $ rules-manager [command] [options]

${chalk.bold("COMMANDS")}
  init                Initialize a new rules-manager configuration file
  install             Install rules from configured sources
  list                List all configured rules and their status

${chalk.bold("OPTIONS")}
  -h, --help          Show this help message
  -v, --version       Show version number

${chalk.bold("EXAMPLES")}
  $ rules-manager init
  $ rules-manager install
  $ rules-manager list
`);
}
