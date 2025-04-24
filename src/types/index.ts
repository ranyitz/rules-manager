// Configuration interfaces
export type Rule = string;

export interface Rules {
  [ruleName: string]: Rule;
}

export interface Config {
  ides: string[];
  rules: Rules;
}
