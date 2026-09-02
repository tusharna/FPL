import { describe, expect, it } from "vitest";
import { AIProviderError, OpenAIProvider } from "../lib/ai/provider";
import type { AIReportInput } from "../lib/ai/types";

const input = { gameweek: 3 } as AIReportInput;

describe("OpenAI provider errors", () => {
  it("maps 401 to an unauthorized error without exposing secrets", async () => {
    const provider = new OpenAIProvider(
      async () => new Response("nope", { status: 401 }),
      "sk-test",
      "gpt-4o-mini",
      1000,
    );
    await expect(provider.generateReport(input)).rejects.toMatchObject({
      code: "unauthorized",
    } satisfies Partial<AIProviderError>);
  });

  it("maps 429 to a rate-limit error", async () => {
    const provider = new OpenAIProvider(
      async () => new Response("slow", { status: 429 }),
      "sk-test",
      "gpt-4o-mini",
      1000,
    );
    await expect(provider.generateReport(input)).rejects.toMatchObject({
      code: "rate_limit",
    });
  });

  it("maps invalid JSON", async () => {
    const provider = new OpenAIProvider(
      async () =>
        new Response(
          JSON.stringify({ choices: [{ message: { content: "not-json" } }] }),
          { status: 200 },
        ),
      "sk-test",
      "gpt-4o-mini",
      1000,
    );
    await expect(provider.generateReport(input)).rejects.toMatchObject({
      code: "invalid_json",
    });
  });
});
