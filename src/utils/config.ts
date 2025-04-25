import fs from "fs-extra";
import path from "node:path";
import { Config } from "../types";

const CONFIG_FILE = "rules-manager.json";

/**
 * Get the configuration from the rules-manager.json file
 */
export function getConfig(): Config | null {
  const configPath = path.join(process.cwd(), CONFIG_FILE);

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const configContent = fs.readFileSync(configPath, "utf8");
    return JSON.parse(configContent) as Config;
  } catch (error) {
    console.error("Error reading configuration file:", error);
    return null;
  }
}

/**
 * Save the configuration to the rules-manager.json file
 */
export function saveConfig(config: Config): boolean {
  const configPath = path.join(process.cwd(), CONFIG_FILE);

  try {
    fs.writeJsonSync(configPath, config, { spaces: 2 });
    return true;
  } catch (error) {
    console.error("Error writing configuration file:", error);
    return false;
  }
}
