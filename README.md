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

| Script      | Description                                         |
| ----------- | --------------------------------------------------- |
| `code-snap` | Extracts code from a screenshot using OpenRouter AI |
| `text-snap` | Extracts text from a screenshot using OpenRouter AI |
