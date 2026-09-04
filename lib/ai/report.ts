import type { GameweekAnalysis } from "@/lib/analysis/types";
import { createFallbackReport } from "./fallback";
import {
  AIProviderError,
  buildCorrectionPrompt,
  createAIProvider,
  hasAICredentials,
} from "./provider";
import type { AIProvider, AIReportInput, ReportResult } from "./types";
import { lockReportToEngine, validateReport } from "./validate";

export async function generateGameweekReport(
  input: AIReportInput,
  analysis: GameweekAnalysis,
  provider?: AIProvider,
): Promise<ReportResult> {
  const fallbackNotice =
    "AI unavailable — showing deterministic report. Check your API key and try again; generation can take up to a minute.";

  if (!provider && !hasAICredentials()) {
    return {
      report: createFallbackReport(analysis),
      source: "fallback",
      notice: fallbackNotice,
    };
  }

  const active = provider ?? createAIProvider();

  try {
    const first = await active.generateReport(input);
    const firstCheck = validateReport(first, input);
    if (firstCheck.ok) {
      return {
        report: lockReportToEngine(firstCheck.report, input),
        source: "ai",
      };
    }

    const retry = await active.generateReport(
      input,
      buildCorrectionPrompt(firstCheck.errors),
    );
    const retryCheck = validateReport(retry, input);
    if (retryCheck.ok) {
      return {
        report: lockReportToEngine(retryCheck.report, input),
        source: "ai",
      };
    }

    return {
      report: createFallbackReport(analysis),
      source: "fallback",
      notice: fallbackNotice,
    };
  } catch (error) {
    const detail =
      error instanceof AIProviderError
        ? error.message
        : error instanceof Error
          ? error.message
          : null;
    return {
      report: createFallbackReport(analysis),
      source: "fallback",
      notice: detail ? `${fallbackNotice} (${detail})` : fallbackNotice,
    };
  }
}

export function publicErrorMessage(): string {
  return "AI report unavailable. The deterministic FPL analysis is still available.";
}
