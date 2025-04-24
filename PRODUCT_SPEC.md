# ai-rules - Product Specification

## Overview

ai-rules is a TypeScript CLI tool designed to help developers manage AI IDE rules across different projects. It enables teams to share, synchronize, and maintain rule configurations from various sources, ensuring consistent AI assistant behavior across development environments.

## Target Users

- Development teams collaborating on projects using AI assistants
- Individual developers working across multiple projects
- Organizations maintaining standardized AI assistant configurations

## Use Cases

### 1. Public URL Source Management

Teams can share rules via public URLs (such as GitHub Gists):

- Rules are maintained in a central, publicly accessible location
- The tool downloads and installs rules from these URLs
- Updates can be easily synchronized across team members

### 2. NPM Package Integration

Teams can distribute rules as npm packages:

- Rules are specified as dev dependencies in the project
- The tool creates symlinks from the package to the appropriate IDE locations
- Version control is handled through npm versioning

### 3. Local Rule Management

Individual developers can create and use their own rules:

- Rules are stored in local files/directories
- The tool manages the installation to appropriate IDE locations
- Developers can easily reuse rules across projects

## Supported IDEs

- Cursor (individual .mdc files)
- Windsurf (concatenated .windsurfrules file)
- Extensible architecture for future IDE support

## Configuration

Users configure ai-rules through a JSON file (ai-rules.json) defining:

- Rule sources (URLs, npm packages, local paths)
- Target IDEs for installation
- Custom installation paths if needed

## Key Features

1. Multi-source rule management
2. Cross-IDE compatibility
3. Simple command-line interface
4. Rule synchronization
5. Version management

## Technical Requirements

- Node.js environment
- TypeScript implementation
- Minimal dependencies
- Cross-platform compatibility
