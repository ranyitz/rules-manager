// Configuration interfaces
export interface Rule {
  source: string;
  type: "url" | "npm" | "local";
}

export interface Rules {
  [ruleName: string]: Rule;
}

export interface Config {
  ides: string[];
  rules: Rules;
}
