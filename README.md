# ai-rules

A TypeScript CLI tool for managing AI IDE rules across different projects and teams.

## Overview

ai-rules helps developers manage, share, and synchronize AI assistant rules across different projects and IDEs. It supports rules from multiple sources including public URLs, npm packages, and local files.

## Installation

```bash
npm install -g ai-rules
```

## Usage

### Initialize a new configuration

```bash
ai-rules init
```

This creates a new `ai-rules.json` configuration file in your current project.

### Install rules from configured sources

```bash
ai-rules install
```

This command downloads, links, or copies rules from the configured sources to the appropriate IDE locations.

### List configured rules

```bash
ai-rules list
```

Displays all configured rules, their sources, and installation status.

## Configuration

ai-rules uses a JSON configuration file (`ai-rules.json`) with the following structure:

```json
{
  "ides": ["cursor", "windsurf"],
  "rules": {
    "eslint-standard": {
      "source": "https://gist.github.com/user/abc123def456",
      "type": "url"
    },
    "react-best-practices": {
      "source": "@company/ai-rules-react",
      "type": "npm"
    },
    "personal-rules": {
      "source": "./rules/custom.mdc",
      "type": "local"
    }
  }
}
```

## Supported IDEs

- Cursor (individual .mdc files)
- Windsurf (concatenated .windsurfrules file)

## License

MIT
