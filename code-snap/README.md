# code-snap

Extracts code from a screenshot using Gemini AI and returns it as JSON.

## Usage

```
export GEMINI_API_KEY="your-gemini-api-key"
node /path/to/shortcut-kit/code-snap/index.js
```

Receives a screenshot as raw bytes via `stdin`, sends it to Gemini, and writes a JSON result to `stdout`.

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

| Error                       | Cause                           |
| --------------------------- | ------------------------------- |
| `Screenshot cancelled`      | Empty stdin                     |
| `Screenshot too small`      | Image under 10KB                |
| `Image too large`           | Image over 25MB                 |
| `Request timed out`         | Gemini API took over 15s        |
| `Invalid response from API` | Gemini returned non-JSON        |
| `API error`                 | Gemini returned an error status |

## Environment

| Variable         | Required | Description    |
| ---------------- | -------- | -------------- |
| `GEMINI_API_KEY` | Yes      | Gemini API key |

## Apple Shortcuts setup

1. Take screenshot of area
2. Run shell script: `node /path/to/shortcut-kit/code-snap/index.js` with screenshot as stdin
3. "Get Dictionary from Input" on the output
4. If `detected` is false → show notification with `error`
5. If `detected` is true → copy `code` to clipboard
