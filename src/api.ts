import {
  InstallOptions,
  InstallResult,
  install as installInternal,
} from "./commands/install";

/**
 * Install AICM rules based on configuration
 * @param options Install options
 * @returns Result of the install operation
 */
export async function install(
  options: InstallOptions = {},
): Promise<InstallResult> {
  return installInternal(options);
}

export {
  Config,
  Rule,
  Rules,
  RuleMetadata,
  RuleContent,
  RuleCollection,
} from "./types";
