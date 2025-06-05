import fs from "fs-extra";
import path from "node:path";
import { NormalizedConfig } from "../types";

/**
 * Write MCP servers configuration to IDE targets
 * @param mcpServers The MCP servers configuration
 * @param ides The IDEs to write to
 * @param cwd The current working directory
 */
export function writeMcpServersToTargets(
  mcpServers: NormalizedConfig["mcpServers"],
  ides: string[],
  cwd: string,
): void {
  if (!mcpServers) return;

  for (const ide of ides) {
    if (ide === "cursor") {
      const mcpPath = path.join(cwd, ".cursor", "mcp.json");
      writeMcpServersToFile(mcpServers, mcpPath);
    }
    // Windsurf does not support project mcpServers, so skip
  }
}

/**
 * Write MCP servers configuration to a specific file
 * @param mcpServers The MCP servers configuration
 * @param mcpPath The path to the mcp.json file
 */
export function writeMcpServersToFile(
  mcpServers: NormalizedConfig["mcpServers"],
  mcpPath: string,
): void {
  if (!mcpServers) return;
  fs.ensureDirSync(path.dirname(mcpPath));

  const existingConfig: Record<string, unknown> = fs.existsSync(mcpPath)
    ? fs.readJsonSync(mcpPath)
    : {};

  const existingMcpServers = existingConfig?.mcpServers ?? {};

  // Filter out any existing aicm-managed servers (with aicm: true)
  // This removes stale aicm servers that are no longer in the configuration
  const userMcpServers: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(existingMcpServers)) {
    if (typeof value === "object" && value !== null && value.aicm !== true) {
      userMcpServers[key] = value;
    }
  }

  // Mark new aicm servers as managed and filter out canceled servers
  const aicmMcpServers: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(mcpServers)) {
    if (value !== false) {
      aicmMcpServers[key] = {
        ...value,
        aicm: true,
      };
    }
  }

  // Merge user servers with aicm servers (aicm servers override user servers with same key)
  const mergedMcpServers = {
    ...userMcpServers,
    ...aicmMcpServers,
  };

  const mergedConfig = {
    ...existingConfig,
    mcpServers: mergedMcpServers,
  };

  fs.writeJsonSync(mcpPath, mergedConfig, { spaces: 2 });
}
