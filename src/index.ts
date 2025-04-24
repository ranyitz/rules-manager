#!/usr/bin/env node

import args from "args";
import { initCommand } from "./commands/init";
import { installCommand } from "./commands/install";
import { listCommand } from "./commands/list";

// Define version from package.json
const pkg = require("../package.json");
args.version(pkg.version);

// Register commands
args
  .command("init", "Initialize a new ai-rules configuration file", initCommand)
  .command("install", "Install rules from configured sources", installCommand)
  .command("list", "List all configured rules and their status", listCommand);

// Parse arguments
const flags = args.parse(process.argv);

// Show help when no command is provided
if (!args.sub.length) {
  args.showHelp();
}
