// Configuration interfaces
export type Rule = string;

export interface Rules {
  [ruleName: string]: Rule;
}

export interface Config {
  ides: string[];
  rules: Rules;
  presets?: string[];
}

// Rule metadata and content models
export interface RuleMetadata {
  type?: string;
  alwaysApply?: boolean | string;
  globs?: string[] | string;
  description?: string;
  [key: string]: any;
}

export interface RuleContent {
  name: string;
  content: string;
  metadata: RuleMetadata;
  sourcePath: string;
}

// Collection of rules to be processed
export interface RuleCollection {
  cursor: RuleContent[];
  windsurf: RuleContent[];
}
