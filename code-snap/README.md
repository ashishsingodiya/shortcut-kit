# code-snap

Extracts code from a screenshot using OpenRouter AI and returns it as JSON.

## Usage

```bash
export OPENROUTER_API_KEY="your-openrouter-api-key"
export MODEL="your-openrouter-model-id"
node /path/to/shortcut-kit/code-snap/main.js
```

Receives a screenshot as raw bytes via `stdin`, sends it to OpenRouter, and writes a JSON result to `stdout`.

## Output

```json
{
  "detected": true,
  "code": "console.log('Hello World')",
  "language": "javascript",
  "error": null
}
```

| Field      | Type           | Description                                                  |
| ---------- | -------------- | ------------------------------------------------------------ |
| `detected` | boolean        | Whether code was found in the screenshot                     |
| `code`     | string \| null | The extracted code                                           |
| `language` | string \| null | Detected language in lowercase (e.g. `typescript`, `python`) |
| `error`    | string \| null | Human-readable error message, null on success                |

## Error cases

| Error                       | Cause                               |
| --------------------------- | ----------------------------------- |
| `Screenshot cancelled`      | Empty stdin                         |
| `Screenshot too small`      | Image under 10KB                    |
| `Image too large`           | Image over 25MB                     |
| `Request timed out`         | OpenRouter API took over 15s        |
| `Invalid response from API` | OpenRouter returned non-JSON        |
| `API error`                 | OpenRouter returned an error status |

## Environment

| Variable             | Required | Description                         |
| -------------------- | -------- | ----------------------------------- |
| `OPENROUTER_API_KEY` | Yes      | OpenRouter API key                  |
| `MODEL`              | Yes      | Any vision-capable OpenRouter model |

## Testing

Use `test.js` to verify the API response for a given image file:

```bash
node code-snap/test.js /path/to/screenshot.png
```

This logs the raw API content and the parsed result to the console.

## Apple Shortcuts setup

1. Take screenshot of area
2. Run shell script: `node /path/to/shortcut-kit/code-snap/main.js` with screenshot as stdin
3. "Get Dictionary from Input" on the output
4. If `detected` is false → show notification with `error`
5. If `detected` is true → copy `code` to clipboard
