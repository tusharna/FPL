import { describe, expect, it } from "vitest";
import { createFallbackReport } from "../lib/ai/fallback";
import { toAIReportInput } from "../lib/ai/input";
import { generateGameweekReport } from "../lib/ai/report";
import { lockReportToEngine, validateReport } from "../lib/ai/validate";
import { selectBestXi } from "../lib/analysis/lineup";
import { selectCaptaincy } from "../lib/analysis/captain";
import { riskLevelFromScores } from "../lib/analysis/risk";
import type { GameweekAnalysis } from "../lib/analysis/types";
import type { AIProvider, AIReport } from "../lib/ai/types";
import { scoredSquad } from "./helpers";

function mockAnalysis(): GameweekAnalysis {
  const squad = scoredSquad();
  const { formation, xi } = selectBestXi(squad);
  const bench = squad.filter((player) => !xi.some((row) => row.playerId === player.playerId));
  const { captain, viceCaptain } = selectCaptaincy(xi);
  const playerOut = squad.find((player) => player.playerId === 12)!;
  const playerIn = xi[xi.length - 1]!;

  return {
    gameweek: 3,
    recommendedFormation: formation.label,
    recommendedXI: xi,
    benchOrder: bench,
    captain,
    viceCaptain,
    lineupChanges: [
      {
        playerIn,
        playerOut,
      },
    ],
    playerRisks: squad.map((player) => ({
      player,
      risk: riskLevelFromScores(player.availabilityRisk, player.minutesRisk),
      reasons: ["No material availability flags in FPL data"],
    })),
    transferRecommendation: {
      action: "SAVE",
      reasons: ["SAVE TRANSFER", "No legal replacement clears the gain threshold"],
    },
    topTransferCandidates: [],
    fixtureOutlook: squad.map((player) => ({
      playerId: player.playerId,
      name: player.webName,
      position: player.position,
      fixtureScore: player.fixtureScore,
      fixtureScoreMedium: player.fixtureScoreMedium,
      summary: "neutral",
    })),
    generatedAt: "2026-09-02T00:00:00.000Z",
  };
}

function validReport(analysis: GameweekAnalysis): AIReport {
  const input = toAIReportInput(analysis, analysis.recommendedXI, analysis.benchOrder);
  return {
    title: "GW3 Team Report",
    executiveSummary: "The model prefers the supplied XI and captain.",
    recommendedXI: {
      formation: input.recommendation.formation,
      explanation: "Highest-scoring legal formation from the squad.",
    },
    captain: {
      player: input.captain.name,
      explanation: "Strongest captain profile in the recommended XI.",
      confidence: input.captain.confidence,
    },
    viceCaptain: {
      player: input.viceCaptain.name,
      explanation: "Second-best captain profile.",
    },
    lineupChanges: {
      summary: "One change between the current XI and the recommendation.",
      changes: input.lineupChanges.map((change) => ({
        playerIn: change.playerIn.name,
        playerOut: change.playerOut.name,
        explanation: "Better overall score for the recommended shape.",
      })),
    },
    transfer: {
      action: "SAVE",
      explanation: "The data suggests saving the transfer.",
    },
    bench: {
      explanation: "Unused goalkeeper first, then outfield cover.",
    },
    risks: input.risks.slice(0, 2).map((item) => ({
      player: item.player.name,
      risk: item.risk,
      explanation: item.reasons[0] ?? "Worth monitoring.",
    })),
    shortTerm: input.shortTerm.summary,
    mediumTerm: input.mediumTerm.summary,
    finalVerdict: "Keep the engine decisions and monitor minutes.",
  };
}

describe("AI input", () => {
  it("copies captain, vice-captain, transfer, risks, and recommended players", () => {
    const analysis = mockAnalysis();
    const currentXi = analysis.recommendedXI.slice(0, 11);
    const input = toAIReportInput(analysis, currentXi, analysis.benchOrder);

    expect(input.gameweek).toBe(3);
    expect(input.recommendation.formation).toBe(analysis.recommendedFormation);
    expect(input.recommendation.startingXI.map((player) => player.id)).toEqual(
      analysis.recommendedXI.map((player) => player.playerId),
    );
    expect(input.captain.name).toBe(analysis.captain.player.webName);
    expect(input.viceCaptain.name).toBe(analysis.viceCaptain.player.webName);
    expect(input.transferRecommendation.action).toBe("SAVE");
    expect(input.risks).toHaveLength(analysis.playerRisks.length);
    expect(input.shortTerm.gameweeks).toBe(1);
    expect(input.mediumTerm.gameweeks).toBe(5);
  });
});

describe("validation", () => {
  it("accepts a valid report", () => {
    const analysis = mockAnalysis();
    const input = toAIReportInput(analysis, analysis.recommendedXI, analysis.benchOrder);
    const result = validateReport(validReport(analysis), input);
    expect(result.ok).toBe(true);
  });

  it("fails when a required field is missing", () => {
    const analysis = mockAnalysis();
    const input = toAIReportInput(analysis, analysis.recommendedXI, analysis.benchOrder);
    const report = validReport(analysis) as unknown as Record<string, unknown>;
    delete report.finalVerdict;
    const result = validateReport(report, input);
    expect(result.ok).toBe(false);
  });

  it("fails on an invalid enum", () => {
    const analysis = mockAnalysis();
    const input = toAIReportInput(analysis, analysis.recommendedXI, analysis.benchOrder);
    const report = validReport(analysis);
    report.transfer.action = "WILDCARD" as "SAVE";
    const result = validateReport(report, input);
    expect(result.ok).toBe(false);
  });

  it("fails on an unknown captain", () => {
    const analysis = mockAnalysis();
    const input = toAIReportInput(analysis, analysis.recommendedXI, analysis.benchOrder);
    const report = validReport(analysis);
    report.captain.player = "Not In Squad";
    const result = validateReport(report, input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(" ")).toMatch(/captain/i);
    }
  });

  it("fails when the transfer action is overridden", () => {
    const analysis = mockAnalysis();
    const input = toAIReportInput(analysis, analysis.recommendedXI, analysis.benchOrder);
    const report = validReport(analysis);
    report.transfer.action = "TRANSFER";
    const result = validateReport(report, input);
    expect(result.ok).toBe(false);
  });
});

describe("decision locking", () => {
  it("cannot keep an AI override of formation, captain, vice, or transfer", () => {
    const analysis = mockAnalysis();
    const input = toAIReportInput(analysis, analysis.recommendedXI, analysis.benchOrder);
    const report = validReport(analysis);
    report.recommendedXI.formation = "2-2-6";
    report.captain.player = "Haaland";
    report.viceCaptain.player = "Salah";
    report.transfer.action = "TRANSFER";
    const locked = lockReportToEngine(report, input);
    expect(locked.recommendedXI.formation).toBe(input.recommendation.formation);
    expect(locked.captain.player).toBe(input.captain.name);
    expect(locked.viceCaptain.player).toBe(input.viceCaptain.name);
    expect(locked.transfer.action).toBe("SAVE");
  });
});

describe("fallback", () => {
  it("builds a deterministic report from Phase 2 analysis", () => {
    const analysis = mockAnalysis();
    const report = createFallbackReport(analysis);
    expect(report.recommendedXI.formation).toBe(analysis.recommendedFormation);
    expect(report.captain.player).toBe(analysis.captain.player.webName);
    expect(report.viceCaptain.player).toBe(analysis.viceCaptain.player.webName);
    expect(report.transfer.action).toBe("SAVE");
    expect(report.title).toMatch(/GW3/);
  });

  it("returns fallback when no AI provider is configured", async () => {
    const analysis = mockAnalysis();
    const input = toAIReportInput(analysis, analysis.recommendedXI, analysis.benchOrder);
    const previousKey = process.env.OPENAI_API_KEY;
    const previousProvider = process.env.AI_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    process.env.AI_PROVIDER = "none";
    try {
      const result = await generateGameweekReport(input, analysis);
      expect(result.source).toBe("fallback");
      expect(result.notice).toMatch(/deterministic report/i);
      expect(result.report.captain.player).toBe(analysis.captain.player.webName);
      expect(result.report.transfer.action).toBe(analysis.transferRecommendation.action);
    } finally {
      if (previousKey) {
        process.env.OPENAI_API_KEY = previousKey;
      }
      if (previousProvider) {
        process.env.AI_PROVIDER = previousProvider;
      } else {
        delete process.env.AI_PROVIDER;
      }
    }
  });

  it("returns fallback when the provider throws", async () => {
    const analysis = mockAnalysis();
    const input = toAIReportInput(analysis, analysis.recommendedXI, analysis.benchOrder);
    const provider: AIProvider = {
      generateReport: async () => {
        throw new Error("provider down");
      },
    };
    const result = await generateGameweekReport(input, analysis, provider);
    expect(result.source).toBe("fallback");
  });

  it("returns fallback for a malformed response that fails validation twice", async () => {
    const analysis = mockAnalysis();
    const input = toAIReportInput(analysis, analysis.recommendedXI, analysis.benchOrder);
    const provider: AIProvider = {
      generateReport: async () => ({ not: "a report" }) as unknown as AIReport,
    };
    const result = await generateGameweekReport(input, analysis, provider);
    expect(result.source).toBe("fallback");
  });

  it("accepts a valid provider response without changing engine decisions", async () => {
    const analysis = mockAnalysis();
    const input = toAIReportInput(analysis, analysis.recommendedXI, analysis.benchOrder);
    const provider: AIProvider = {
      generateReport: async () => validReport(analysis),
    };
    const result = await generateGameweekReport(input, analysis, provider);
    expect(result.source).toBe("ai");
    expect(result.report.captain.player).toBe(analysis.captain.player.webName);
    expect(result.report.viceCaptain.player).toBe(analysis.viceCaptain.player.webName);
    expect(result.report.recommendedXI.formation).toBe(analysis.recommendedFormation);
    expect(result.report.transfer.action).toBe("SAVE");
  });
});
