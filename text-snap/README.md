# text-snap

Extracts text from a screenshot using OpenRouter AI and returns it as JSON.

## Usage

```bash
export OPENROUTER_API_KEY="your-openrouter-api-key"
export MODEL="your-openrouter-model-id"
node /path/to/shortcut-kit/text-snap/index.js
```

Receives a screenshot as raw bytes via `stdin`, sends it to OpenRouter, and writes a JSON result to `stdout`.

## Output

```json
{
  "detected": true,
  "text": "Hello World",
  "error": null
}
```

| Field      | Type           | Description                                       |
| ---------- | -------------- | ------------------------------------------------- |
| `detected` | boolean        | Whether readable text was found in the screenshot |
| `text`     | string \| null | The extracted text                                |
| `error`    | string \| null | Human-readable error message, null on success     |

## Error Cases

| Error                         | Cause                               |
| ----------------------------- | ----------------------------------- |
| `Screenshot cancelled`        | Empty stdin                         |
| `Screenshot too small`        | Image under 10KB                    |
| `Image too large`             | Image over 25MB                     |
| `Request timed out`           | OpenRouter API took over 15s        |
| `Invalid response from API`   | OpenRouter returned non-JSON        |
| `API error`                   | OpenRouter returned an error status |
| `No text found in screenshot` | No readable text detected           |

## Environment

| Variable             | Required | Description                         |
| -------------------- | -------- | ----------------------------------- |
| `OPENROUTER_API_KEY` | Yes      | OpenRouter API key                  |
| `MODEL`              | Yes      | Any vision-capable OpenRouter model |

## Testing

Use `test.js` to verify the API response for a given image file:

```bash
node text-snap/test.js /path/to/screenshot.png
```

This logs the raw API content and the parsed result to the console.

## Apple Shortcuts Setup

1. Take screenshot of area
2. Run shell script: `node /path/to/shortcut-kit/text-snap/index.js` with screenshot as stdin
3. Get Dictionary from Input on the output
4. If `detected` is false → show notification with `error`
5. If `detected` is true → copy `text` to clipboard

## Example Output

```json
{
  "detected": true,
  "text": "Meeting Notes\n\n- Review roadmap\n- Ship v1 this week",
  "error": null
}
```
