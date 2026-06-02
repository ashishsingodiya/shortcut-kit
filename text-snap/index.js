import sharp from "sharp";

const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.MODEL;
const MIN_VALID_BYTES = 10000;
const MAX_DIMENSION = 1080;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const PROMPT_TEXT = `
You are an OCR text extraction system.

Analyze the screenshot carefully.

If the screenshot contains readable text:
- Extract all visible text accurately
- Fix obvious OCR mistakes
- Preserve paragraph breaks
- Preserve lists and line breaks when possible
- Do not summarize
- Do not explain
- Return a JSON object with detected: true and the extracted text

If the screenshot does NOT contain readable text:
- Return a JSON object with detected: false and text: null

Respond with ONLY a raw JSON object. No markdown, no explanation.

Example:
{"detected":true,"text":"Hello world"}

Example:
{"detected":false,"text":null}
`;

function respond(payload) {
  process.stdout.write(JSON.stringify(payload) + "\n", () => process.exit(0));
}

function respondError(error) {
  respond({ detected: false, text: null, error });
}

if (!API_KEY) {
  console.error("Missing OPENROUTER_API_KEY");
  process.exit(1);
}

async function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];

    process.stdin.on("data", (chunk) => chunks.push(chunk));

    process.stdin.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

async function extractText() {
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
    response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: PROMPT_TEXT,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
      }),
    });
  } catch (error) {
    if (error.name === "AbortError") {
      return respondError("Request timed out");
    }

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

  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    return respondError("No response returned from API");
  }

  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch {
    return respondError("Failed to parse API response");
  }

  if (!parsed.detected || !parsed.text?.trim()) {
    return respond({
      detected: false,
      text: null,
      error: "No text found in screenshot",
    });
  }

  const normalized = parsed.text.trim().replace(/\r\n/g, "\n");

  respond({
    detected: true,
    text: normalized,
    error: null,
  });
}

extractText().catch((error) => respondError(error.message));
