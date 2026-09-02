import type { GameweekAnalysis } from "@/lib/analysis/types";
import { toAIReportInput } from "./input";
import type { AIReport } from "./types";

export function createFallbackReport(analysis: GameweekAnalysis): AIReport {
  const input = toAIReportInput(
    analysis,
    analysis.recommendedXI,
    analysis.benchOrder,
  );
  const captain = analysis.captain.player.webName;
  const vice = analysis.viceCaptain.player.webName;
  const transfer = analysis.transferRecommendation;
  const changeSummary =
    analysis.lineupChanges.length === 0
      ? "No starting XI changes recommended."
      : analysis.lineupChanges
          .map(
            (change) =>
              `${change.playerOut.webName} → Bench; ${change.playerIn.webName} → Starting XI`,
          )
          .join(". ");

  const riskLines = analysis.playerRisks
    .filter((item) => item.risk !== "LOW")
    .slice(0, 6);

  return {
    title: `GW${analysis.gameweek} Team Report`,
    executiveSummary: `The deterministic engine prefers ${analysis.recommendedFormation} for Gameweek ${analysis.gameweek}. ${captain} is the strongest captain profile. Transfer: ${transfer.action}.`,
    recommendedXI: {
      formation: analysis.recommendedFormation,
      explanation: `The model prefers ${analysis.recommendedFormation} after scoring every legal formation from the current 15-player squad. This is the highest combined overall-score XI, not a simple sort of all 15 players.`,
    },
    captain: {
      player: captain,
      explanation: `The deterministic engine has selected ${captain} as captain based on the highest captain score among eligible players. ${analysis.captain.reasons[0] ?? ""}`.trim(),
      confidence: analysis.captain.confidence,
    },
    viceCaptain: {
      player: vice,
      explanation: `${vice} is the second-best captain profile in the recommended XI.`,
    },
    lineupChanges: {
      summary: changeSummary,
      changes: analysis.lineupChanges.map((change) => ({
        playerIn: change.playerIn.webName,
        playerOut: change.playerOut.webName,
        explanation: `${change.playerIn.webName} has the better overall profile for the recommended XI; ${change.playerOut.webName} is the lower-scoring option and drops to the bench.`,
      })),
    },
    transfer: {
      action: transfer.action,
      explanation:
        transfer.action === "SAVE"
          ? "No transfer is recommended because the best legal transfer does not provide enough improvement over saving the transfer."
          : `The data suggests ${transfer.playerOut?.webName ?? "the outgoing player"} to ${transfer.playerIn?.webName ?? "an incoming player"} is worth considering. This is a recommendation only.`,
    },
    bench: {
      explanation: `Bench order starts with the unused goalkeeper, then outfield players by expected points, minutes security, fixture quality, and availability. ${analysis.benchOrder.map((player) => player.webName).join(", ")}.`,
    },
    risks: (riskLines.length > 0 ? riskLines : analysis.playerRisks.slice(0, 3)).map(
      (item) => ({
        player: item.player.webName,
        risk: item.risk,
        explanation: item.reasons[0] ?? "No material flags in the supplied FPL data.",
      }),
    ),
    shortTerm: input.shortTerm.summary,
    mediumTerm: input.mediumTerm.summary,
    finalVerdict: `Stick with the engine's ${analysis.recommendedFormation}, captain ${captain}, and ${transfer.action} decision. AI narrative is unavailable, so this is the deterministic report.`,
  };
}
