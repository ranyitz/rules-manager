import { install as installInternal } from "./commands/install";
import {
  InstallOptions,
  InstallResult,
} from "./commands/install/install-package";

/**
 * Install AICM rules based on configuration
 * @param options Installation options
 * @returns Result of the install operation
 */
export async function install(
  options: InstallOptions = {},
): Promise<InstallResult> {
  return installInternal(options);
}

export {
  Config,
  NormalizedConfig,
  Rule,
  Rules,
  RuleMetadata,
  RuleContent,
  RuleCollection,
} from "./types";
