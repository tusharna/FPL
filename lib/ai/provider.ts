import { buildCorrectionPrompt, buildSystemPrompt, buildUserPrompt } from "./prompts";
import type { AIProvider, AIReport, AIReportInput } from "./types";

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MODEL = "gpt-4o-mini";

export class AIProviderError extends Error {
  readonly code: "unauthorized" | "rate_limit" | "timeout" | "provider" | "invalid_json";

  constructor(
    message: string,
    code: AIProviderError["code"],
  ) {
    super(message);
    this.name = "AIProviderError";
    this.code = code;
  }
}

function parseModelJson(content: string): AIReport {
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
  try {
    return JSON.parse(trimmed) as AIReport;
  } catch {
    throw new AIProviderError("AI returned invalid JSON.", "invalid_json");
  }
}

export class OpenAIProvider implements AIProvider {
  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly apiKey = process.env.OPENAI_API_KEY,
    private readonly model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
    private readonly timeoutMs = Number(process.env.AI_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS),
  ) {}

  async generateReport(input: AIReportInput, correction?: string): Promise<AIReport> {
    if (!this.apiKey) {
      throw new AIProviderError("AI API key is missing.", "unauthorized");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const messages = [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(input) },
    ];
    if (correction) {
      messages.push({ role: "user", content: correction });
    }

    try {
      const response = await this.fetchImpl("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages,
        }),
      });

      if (response.status === 401) {
        throw new AIProviderError("AI report unavailable because the API key is invalid.", "unauthorized");
      }
      if (response.status === 429) {
        throw new AIProviderError("AI report unavailable because the provider rate-limited the request.", "rate_limit");
      }
      if (!response.ok) {
        throw new AIProviderError("AI report unavailable because the provider returned an error.", "provider");
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string | null } }[];
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) {
        throw new AIProviderError("AI returned invalid JSON.", "invalid_json");
      }
      return parseModelJson(content);
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new AIProviderError("AI report unavailable because the request timed out.", "timeout");
      }
      throw new AIProviderError("AI report unavailable because the provider returned an error.", "provider");
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function hasAICredentials(): boolean {
  const provider = (process.env.AI_PROVIDER ?? "openai").toLowerCase();
  if (provider === "none" || provider === "off") {
    return false;
  }
  return Boolean(process.env.OPENAI_API_KEY);
}

export function createAIProvider(): AIProvider {
  return new OpenAIProvider();
}

export { buildCorrectionPrompt };
