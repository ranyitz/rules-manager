import { install as installInternal } from "./commands/install_v2";
import { InstallOptions, InstallResult } from "./commands/install_v2";

/**
 * Install AICM rules based on configuration (v2)
 * @param options Installation options
 * @returns Result of the install operation
 */
export async function install(
  options: InstallOptions = {},
): Promise<InstallResult> {
  return installInternal(options);
}

// Re-export types for convenience
export type { InstallOptions, InstallResult } from "./commands/install_v2";
export type {
  ResolvedConfig,
  Config,
  RuleFile,
  MCPServers,
} from "./utils/config_v2";
