import sharp from "sharp";

const API_KEY = process.env.GEMINI_API_KEY;
const MIN_VALID_BYTES = 10000;
const MAX_DIMENSION = 1080;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

const MODEL_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    detected: { type: "boolean" },
    code: { type: "string", nullable: true },
    language: { type: "string", nullable: true },
  },
  required: ["detected", "code", "language"],
};

const PROMPT_TEXT = `
You are a code extraction system.

Analyze the screenshot carefully.

If the screenshot contains programming code:
- Extract the cleaned raw code
- Fix OCR mistakes
- Preserve indentation
- Remove line numbers
- Return detected: true, the code, and the programming language name in lowercase (e.g. "typescript", "python", "javascript")

If the screenshot does NOT contain code:
- Return detected: false, code: null, language: null

Never explain your decision.
`;

function respond(payload) {
  process.stdout.write(JSON.stringify(payload) + "\n", () => process.exit(0));
}

function respondError(error) {
  respond({ detected: false, code: null, language: null, error });
}

if (!API_KEY) {
  console.error("Missing GEMINI_API_KEY");
  process.exit(1);
}

async function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

async function extractCode() {
  const imageBuffer = await readStdin();

  if (!imageBuffer || imageBuffer.length < 1) {
    return respondError("Screenshot cancelled");
  }

  if (imageBuffer.length < MIN_VALID_BYTES) {
    return respondError("Screenshot too small");
  }

  if (imageBuffer.length > MAX_IMAGE_BYTES) {
    return respondError("Image too large");
  }

  const optimizedBuffer = await sharp(imageBuffer)
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const base64Image = optimizedBuffer.toString("base64");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${MODEL_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: PROMPT_TEXT }, { inline_data: { mime_type: "image/png", data: base64Image } }],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
          response_schema: RESPONSE_SCHEMA,
        },
      }),
    });
  } catch (error) {
    if (error.name === "AbortError") return respondError("Request timed out");
    return respondError(error.message);
  } finally {
    clearTimeout(timeout);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    return respondError("Invalid response from API");
  }

  if (!response.ok) {
    const message = data?.error?.message ?? "API error";
    return respondError(message);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return respondError("No response returned from API");

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return respondError("Failed to parse API response");
  }

  if (!parsed.detected) {
    return respond({ detected: false, code: null, language: null, error: "No code found in screenshot" });
  }

  const normalized = parsed.code.trim().replace(/\r\n/g, "\n");

  respond({ detected: true, code: normalized, language: parsed.language, error: null });
}

extractCode().catch((error) => respondError(error.message));
