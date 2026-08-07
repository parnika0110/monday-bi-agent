const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 45000;

export class GeminiApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "GeminiApiError";
    this.status = status;
  }
}

function getModel(): string {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

function getKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new GeminiApiError(
      "GEMINI_API_KEY is not set. Add it to your environment variables."
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
- Keep responses to 150-300 words unless the user asked for a leadership update or a report-style answer (risks, data quality, forecast), which can run longer with clear sections.
- Always finish every thought and sentence completely. NEVER stop mid-sentence or cut off abruptly.
- You may use light markdown - **bold** for key figures, short bullet lists, and a "|" table only when comparing several rows of numbers (e.g. sector breakdowns). Don't overuse headings for short answers.
- If the DATA section shows a data-quality warning (missing values, etc.), mention it briefly and factor it into your confidence, but don't dwell on it.
- Do not mention Monday.com's internal mechanics, column names, or that you are an AI model. Just answer as an analyst would.`;

const LEADERSHIP_STYLE_GUIDANCE: Record<string, string> = {
  ceo: "Write this as a 1-on-1 briefing to the CEO: blunt, prioritized, lead with the single most important number or risk, skip pleasantries. Ensure all sections and thoughts end with a complete sentence.",
  board: "Write this as a board-meeting update: formal tone, clearly labeled sections (Pipeline, Revenue, Risks, Recommendations), suitable for reading aloud in a meeting.",
  weekly: "Write this as a routine weekly leadership update: concise, scannable, comparable week-to-week, light on narrative.",
  standard: "Write this as a standard executive summary with clear sections.",
};

async function callGeminiOnce(
  prompt: string,
  key: string,
  model: string,
  attempt = 1
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
  };

  let response: Response;
  try {
    const url = `${GEMINI_API_URL}/${model}:generateContent?key=${encodeURIComponent(key)}`;
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    const isTimeout = (err as Error).name === "AbortError";
    throw new GeminiApiError(
      isTimeout
        ? `Gemini API did not respond within ${REQUEST_TIMEOUT_MS / 1000}s.`
        : `Could not reach Gemini API: ${(err as Error).message}`
    );
  } finally {
    clearTimeout(timeout);
  }

  // Automatic retry on 429 rate limit with exponential backoff pause
  if (response.status === 429 && attempt <= 3) {
    const waitTime = attempt * 2500;
    console.warn(`Gemini 429 rate-limited on model [${model}] (attempt ${attempt}). Pausing ${waitTime}ms before retry...`);
    await new Promise((r) => setTimeout(r, waitTime));
    return callGeminiOnce(prompt, key, model, attempt + 1);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new GeminiApiError(
      `Gemini API returned status ${response.status}. ${text.slice(0, 300)}`,
      response.status
    );
  }

  const json = await response.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new GeminiApiError("Gemini API returned an empty response.");
  }

  return text.trim();
}

export async function generateAnalystResponse(
  userQuestion: string,
  dataSummary: string,
  leadershipStyle?: string,
  customApiKey?: string
): Promise<string> {
  const key = (customApiKey && customApiKey.trim().length > 5) ? customApiKey.trim() : getKey();
  const primaryModel = getModel();

  const styleNote = leadershipStyle ? `\n\nSTYLE:\n${LEADERSHIP_STYLE_GUIDANCE[leadershipStyle] ?? ""}` : "";
  const prompt = `${SYSTEM_PREAMBLE}${styleNote}\n\nQUESTION:\n${userQuestion}\n\nDATA:\n${dataSummary}\n\nWrite the analyst response now.`;

  const candidateModels = Array.from(
    new Set([primaryModel, "gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash-lite", "gemini-2.0-flash"])
  );

  let lastError: unknown;
  for (const m of candidateModels) {
    try {
      return await callGeminiOnce(prompt, key, m);
    } catch (err) {
      lastError = err;
      console.warn(`Gemini model [${m}] attempt failed:`, (err as Error).message);
    }
  }

  throw lastError;
}
