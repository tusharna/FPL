import {
  MEDIUM_TERM_HORIZON,
  SHORT_TERM_HORIZON,
} from "@/lib/analysis/config";
import { riskLevelFromScores } from "@/lib/analysis/risk";
import type {
  FixtureOutlook,
  GameweekAnalysis,
  PlayerAnalysis,
} from "@/lib/analysis/types";
import type { Position } from "@/lib/fpl/types";
import type { AIReportInput, PlayerSummary } from "./types";

function round2(value: number): number {
  return Number(value.toFixed(2));
}

export function formationFromPlayers(
  players: { position: Position }[],
): string {
  const defenders = players.filter((player) => player.position === "DEF").length;
  const midfielders = players.filter((player) => player.position === "MID").length;
  const forwards = players.filter((player) => player.position === "FWD").length;
  return `${defenders}-${midfielders}-${forwards}`;
}

export function toPlayerSummary(player: PlayerAnalysis): PlayerSummary {
  const summary: PlayerSummary = {
    id: player.playerId,
    name: player.webName,
    position: player.position,
    price: round2(player.price),
    form: round2(player.form),
    totalPoints: player.totalPoints,
    pointsPerGame: round2(player.pointsPerGame),
    expectedPointsNext: round2(player.expectedPointsNext),
    expectedGoals: round2(player.expectedGoals),
    expectedAssists: round2(player.expectedAssists),
    expectedGoalInvolvement: round2(player.expectedGoalInvolvement),
    minutes: player.minutes,
    starts: player.starts,
    ownership: round2(player.ownership),
    fixtureScore: round2(player.fixtureScore),
    availabilityRisk: riskLevelFromScores(player.availabilityRisk, 0),
    minutesRisk: riskLevelFromScores(0, player.minutesRisk),
    overallScore: round2(player.overallScore),
  };

  if (player.chanceOfPlaying != null) {
    summary.chanceOfPlaying = player.chanceOfPlaying;
  }
  if (player.news) {
    summary.news = player.news;
  }

  return summary;
}

function outlookSummary(
  outlook: FixtureOutlook[],
  field: "fixtureScore" | "fixtureScoreMedium",
  gameweeks: number,
): string {
  if (outlook.length === 0) {
    return "Fixture outlook is unavailable from the supplied analysis.";
  }
  const ranked = [...outlook].sort((left, right) => right[field] - left[field]);
  const average =
    outlook.reduce((sum, row) => sum + row[field], 0) / outlook.length;
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  return `Next ${gameweeks} GW average fixture score ${average.toFixed(2)}. ${best?.name} has the most favorable profile (${best?.summary ?? "n/a"}); ${worst?.name} looks more difficult.`;
}

export function currentAnalysisPlayers(
  analysis: GameweekAnalysis,
  ids: number[],
): PlayerAnalysis[] {
  const byId = new Map(
    analysis.playerRisks.map((item) => [item.player.playerId, item.player]),
  );
  return ids
    .map((id) => byId.get(id))
    .filter((player): player is PlayerAnalysis => player != null);
}

export function toAIReportInput(
  analysis: GameweekAnalysis,
  currentStartingXi: PlayerAnalysis[],
  currentBench: PlayerAnalysis[],
): AIReportInput {
  return {
    gameweek: analysis.gameweek,
    currentTeam: {
      startingXI: currentStartingXi.map(toPlayerSummary),
      bench: currentBench.map(toPlayerSummary),
      formation: formationFromPlayers(currentStartingXi),
    },
    recommendation: {
      formation: analysis.recommendedFormation,
      startingXI: analysis.recommendedXI.map(toPlayerSummary),
      benchOrder: analysis.benchOrder.map(toPlayerSummary),
    },
    captain: {
      name: analysis.captain.player.webName,
      score: round2(analysis.captain.score),
      reasons: analysis.captain.reasons,
      confidence: analysis.captain.confidence,
    },
    viceCaptain: {
      name: analysis.viceCaptain.player.webName,
      score: round2(analysis.viceCaptain.score),
      reasons: analysis.viceCaptain.reasons,
    },
    lineupChanges: analysis.lineupChanges.map((change) => ({
      playerIn: toPlayerSummary(change.playerIn),
      playerOut: toPlayerSummary(change.playerOut),
    })),
    transferRecommendation: {
      action: analysis.transferRecommendation.action,
      playerOut: analysis.transferRecommendation.playerOut
        ? toPlayerSummary(analysis.transferRecommendation.playerOut)
        : undefined,
      playerIn: analysis.transferRecommendation.playerIn
        ? toPlayerSummary(analysis.transferRecommendation.playerIn)
        : undefined,
      score: analysis.transferRecommendation.score,
      reasons: analysis.transferRecommendation.reasons,
    },
    risks: analysis.playerRisks.map((item) => ({
      player: toPlayerSummary(item.player),
      risk: item.risk,
      reasons: item.reasons,
    })),
    shortTerm: {
      gameweeks: SHORT_TERM_HORIZON,
      summary: outlookSummary(
        analysis.fixtureOutlook,
        "fixtureScore",
        SHORT_TERM_HORIZON,
      ),
    },
    mediumTerm: {
      gameweeks: MEDIUM_TERM_HORIZON,
      summary: outlookSummary(
        analysis.fixtureOutlook,
        "fixtureScoreMedium",
        MEDIUM_TERM_HORIZON,
      ),
    },
  };
}
