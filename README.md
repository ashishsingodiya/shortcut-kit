# shortcut-kit

A collection of Node.js scripts for Apple Shortcuts automation.

## Structure

Each script lives in its own folder and is designed to be called from an Apple Shortcut via stdin/stdout.

## Usage

Each script receives input via `stdin` and writes output to `stdout`. See each script's own README for its input/output format.

## Setup

```
pnpm install
```

## Scripts

| Script      | Description                                     |
| ----------- | ----------------------------------------------- |
| `code-snap` | Extracts code from a screenshot using Gemini AI |

## Commit Convention

This repo uses [Conventional Commits](https://www.conventionalcommits.org/).

```
feat(code-snap): add JSON output
fix(code-snap): flush stdout before exit
chore: update dependencies
```
