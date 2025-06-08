// Configuration interfaces
export type Rule = string | false;

export interface Rules {
  [ruleName: string]: Rule;
}

export type MCPServer =
  | {
      command: string;
      args?: string[];
      env?: Record<string, string>;
      url?: never;
    }
  | {
      url: string;
      env?: Record<string, string>;
      command?: never;
      args?: never;
    }
  | false;

export interface MCPServers {
  [serverName: string]: MCPServer;
}

export interface Config {
  targets?: string[];
  rulesDir?: string;
  presets?: string[];
  overrides?: Record<string, string | false>;
  mcpServers?: MCPServers;
  workspaces?: boolean;
}

export interface NormalizedConfig {
  ides: string[];
  rules: Rules;
  presets: string[];
  mcpServers?: MCPServers;
  workspaces?: boolean;
}

// Rule metadata and content models
export interface RuleMetadata {
  type?: string;
  alwaysApply?: boolean | string;
  globs?: string[] | string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface RuleContent {
  name: string;
  content: string;
  metadata: RuleMetadata;
  sourcePath: string;
  presetPath?: string;
}

// Collection of rules to be processed
export interface RuleCollection {
  cursor: RuleContent[];
  windsurf: RuleContent[];
  codex: RuleContent[];
}

export interface PackageInfo {
  relativePath: string;
  absolutePath: string;
  config: NormalizedConfig;
}

export interface WorkspacesInstallResult {
  success: boolean;
  packages: Array<{
    path: string;
    success: boolean;
    error?: string;
    errorStack?: string;
    installedRuleCount: number;
  }>;
  totalRuleCount: number;
}
