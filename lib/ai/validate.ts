import type { AIReport, AIReportInput } from "./types";
import { aiReportSchema } from "./schema";

export type ValidationResult =
  | { ok: true; report: AIReport }
  | { ok: false; errors: string[] };

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function namesMatch(left: string, right: string): boolean {
  return normalizeName(left) === normalizeName(right);
}

function allowedPlayerNames(input: AIReportInput): Set<string> {
  const names = [
    ...input.currentTeam.startingXI,
    ...input.currentTeam.bench,
    ...input.recommendation.startingXI,
    ...input.recommendation.benchOrder,
    input.transferRecommendation.playerIn,
    input.transferRecommendation.playerOut,
  ]
    .filter((player) => player != null)
    .map((player) => normalizeName(player.name));
  return new Set(names);
}

export function validateReport(
  value: unknown,
  input: AIReportInput,
): ValidationResult {
  const parsed = aiReportSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "report"}: ${issue.message}`,
      ),
    };
  }

  const report = parsed.data;
  const errors: string[] = [];
  const names = allowedPlayerNames(input);

  if (report.recommendedXI.formation !== input.recommendation.formation) {
    errors.push("Formation does not match the deterministic recommendation");
  }
  if (!namesMatch(report.captain.player, input.captain.name)) {
    errors.push("Unknown or overridden captain");
  }
  if (!namesMatch(report.viceCaptain.player, input.viceCaptain.name)) {
    errors.push("Unknown or overridden vice-captain");
  }
  if (report.transfer.action !== input.transferRecommendation.action) {
    errors.push("Transfer action does not match the deterministic recommendation");
  }

  if (input.transferRecommendation.action === "TRANSFER") {
    const incoming = input.transferRecommendation.playerIn?.name;
    if (
      incoming &&
      !report.transfer.explanation.toLowerCase().includes(incoming.toLowerCase())
    ) {
      errors.push("Transfer explanation is missing the recommended incoming player");
    }
  }

  for (const change of report.lineupChanges.changes) {
    if (!names.has(normalizeName(change.playerIn))) {
      errors.push(`Unknown lineup player in: ${change.playerIn}`);
    }
    if (!names.has(normalizeName(change.playerOut))) {
      errors.push(`Unknown lineup player out: ${change.playerOut}`);
    }
  }

  for (const risk of report.risks) {
    if (!names.has(normalizeName(risk.player))) {
      errors.push(`Unknown risk player: ${risk.player}`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, report };
}

export function lockReportToEngine(
  report: AIReport,
  input: AIReportInput,
): AIReport {
  return {
    ...report,
    recommendedXI: {
      ...report.recommendedXI,
      formation: input.recommendation.formation,
    },
    captain: {
      ...report.captain,
      player: input.captain.name,
      confidence: input.captain.confidence,
    },
    viceCaptain: {
      ...report.viceCaptain,
      player: input.viceCaptain.name,
    },
    transfer: {
      ...report.transfer,
      action: input.transferRecommendation.action,
    },
    lineupChanges: {
      ...report.lineupChanges,
      changes:
        input.lineupChanges.length === 0
          ? []
          : input.lineupChanges.map((change, index) => ({
              playerIn: change.playerIn.name,
              playerOut: change.playerOut.name,
              explanation:
                report.lineupChanges.changes[index]?.explanation ??
                `${change.playerIn.name} is the stronger option in the recommended XI; ${change.playerOut.name} drops to the bench.`,
            })),
    },
  };
}
