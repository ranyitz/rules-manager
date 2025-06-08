import fs from "fs-extra";
import path from "node:path";
import fg from "fast-glob";
import {
  Config,
  NormalizedConfig,
  MCPServers,
  MCPServer,
  Rules,
} from "../types";

export const CONFIG_FILE = "aicm.json";

export async function loadConfig(
  cwd?: string,
): Promise<NormalizedConfig | null> {
  const workingDir = cwd || process.cwd();
  const configPath = path.join(workingDir, CONFIG_FILE);
  let raw: Record<string, unknown> | null = null;
  if (fs.existsSync(configPath)) {
    raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } else {
    const pkgPath = path.join(workingDir, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      raw = pkg.aicm || null;
    }
  }

  if (!raw) return null;
  const data = raw as Record<string, unknown>;

  const rulesDir = (data.rulesDir as string) || "./rules";
  const targets: string[] = Array.isArray(data.targets)
    ? (data.targets as string[])
    : ["cursor"];
  const presets: string[] = Array.isArray(data.presets)
    ? (data.presets as string[])
    : [];
  const overrides: Record<string, string | false> =
    (data.overrides as Record<string, string | false>) || {};
  const mcpServers: MCPServers = data.mcpServers
    ? (data.mcpServers as MCPServers)
    : {};

  const rules: Rules = {};
  const rulesDirAbs = path.resolve(workingDir, rulesDir);
  if (fs.existsSync(rulesDirAbs)) {
    const files = await fg("**/*.mdc", { cwd: rulesDirAbs });
    files.sort();
    for (const file of files) {
      const name = file
        .replace(/\.mdc$/, "")
        .split(path.sep)
        .join("/");
      rules[name] = path.join(rulesDirAbs, file);
    }
  }

  for (const preset of presets) {
    let presetConfigPath: string;
    try {
      presetConfigPath = require.resolve(path.join(preset, CONFIG_FILE), {
        paths: [workingDir],
      });
    } catch {
      try {
        presetConfigPath = require.resolve(preset, { paths: [workingDir] });
      } catch {
        continue;
      }
    }

    const presetDir = path.dirname(presetConfigPath);
    const presetData = JSON.parse(fs.readFileSync(presetConfigPath, "utf8"));
    const presetRulesDir = presetData.rulesDir || "./rules";
    const presetRulesAbs = path.resolve(presetDir, presetRulesDir);
    if (fs.existsSync(presetRulesAbs)) {
      const presetFiles = await fg("**/*.mdc", { cwd: presetRulesAbs });
      presetFiles.sort();
      for (const file of presetFiles) {
        const name = file
          .replace(/\.mdc$/, "")
          .split(path.sep)
          .join("/");
        if (!(name in rules)) {
          rules[name] = path.join(presetRulesAbs, file);
        }
      }
    }
    if (presetData.mcpServers) {
      for (const [key, val] of Object.entries(presetData.mcpServers)) {
        if (!(key in mcpServers)) {
          mcpServers[key] = val as MCPServer;
        }
      }
    }
  }

  for (const [ruleName, value] of Object.entries(overrides)) {
    if (value === false) {
      delete rules[ruleName];
    } else {
      rules[ruleName] = path.isAbsolute(value)
        ? value
        : path.resolve(workingDir, value);
    }
  }

  return {
    ides: targets,
    rules,
    mcpServers,
    presets: [],
  };
}

export function saveConfig(config: Config, cwd?: string): boolean {
  const workingDir = cwd || process.cwd();
  const configPath = path.join(workingDir, CONFIG_FILE);

  try {
    fs.writeJsonSync(configPath, config, { spaces: 2 });
    return true;
  } catch (error) {
    console.error("Error writing configuration file:", error);
    return false;
  }
}

export { loadConfig as getConfig };
