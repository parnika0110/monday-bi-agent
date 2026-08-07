const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiApiError";
  }
}

function getModel(): string {
  return process.env.GEMINI_MODEL || "gemini-1.5-flash";
}

function getKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new GeminiApiError(
      "GEMINI_API_KEY is not set. Add it to your environment variables (see .env.example)."
    );
  }
  return key;
}

const SYSTEM_PREAMBLE = `You are a senior business analyst embedded at Skylark Drones, a drone data-as-a-service company.
You are given pre-computed metrics from the company's live Monday.com boards (sales pipeline and work order / billing tracker).

Rules:
- Never invent numbers. Only use the figures given to you in the "DATA" section.
- Write like a sharp business analyst briefing a founder: direct, concise, confident. Not like a chatbot repeating JSON.
- Lead with the headline answer, then supporting detail, then (if relevant) a risk or recommendation.
- Use Indian Rupee formatting (₹) and lakh/crore only if it reads naturally; otherwise plain numbers with commas are fine.
- Keep responses to 120-220 words unless the user asked for a leadership update, which can run longer with clear sections.
- If the DATA section shows a data-quality warning (missing values, etc.), mention it briefly and factor it into your confidence, but don't dwell on it.
- Do not mention Monday.com's internal mechanics, column names, or that you are an AI model. Just answer as an analyst would.`;

export async function generateAnalystResponse(
  userQuestion: string,
  dataSummary: string
): Promise<string> {
  const key = getKey();
  const model = getModel();

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${SYSTEM_PREAMBLE}\n\nQUESTION:\n${userQuestion}\n\nDATA:\n${dataSummary}\n\nWrite the analyst response now.`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
    },
  };

  let response: Response;
  try {
    response = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err) {
    throw new GeminiApiError(`Could not reach Gemini API: ${(err as Error).message}`);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new GeminiApiError(
      `Gemini API returned status ${response.status}. ${text.slice(0, 300)}`
    );
  }

  const json = await response.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new GeminiApiError("Gemini API returned an empty response.");
  }

  return text.trim();
}
