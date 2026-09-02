import { CAPTAIN_SCORE_WEIGHTS } from "./config";
import { clamp01 } from "./risk";
import type { Confidence, PlayerAnalysis, RolePick } from "./types";

export function captainScore(player: PlayerAnalysis): number {
  const w = CAPTAIN_SCORE_WEIGHTS;
  const setPieces = player.penaltiesOrder != null && player.penaltiesOrder > 0
    ? clamp01(1 / player.penaltiesOrder)
    : 0;
  const value =
    w.expectedPoints * clamp01(player.expectedPointsNext / 8) +
    w.fixture * player.fixtureScore +
    w.expectedGoals * clamp01(player.expectedGoals / 1.2) +
    w.expectedAssists * clamp01(player.expectedAssists / 1.2) +
    w.expectedGoalInvolvement * clamp01(player.expectedGoalInvolvement / 2) +
    w.minutesSecurity * player.minutesSecurity +
    w.form * clamp01(player.form / 10) +
    w.availability * (1 - player.availabilityRisk) +
    w.setPieces * setPieces;
  return Number(value.toFixed(4));
}

export function captainReasons(player: PlayerAnalysis, score: number): string[] {
  const reasons = [
    `Captain score ${score.toFixed(2)} from expected points, fixture, and xGI — not season totals`,
    `Expected points next: ${player.expectedPointsNext.toFixed(1)}`,
    `Fixture quality: ${player.fixtureScore.toFixed(2)}`,
    `xGI ${player.expectedGoalInvolvement.toFixed(2)} with minutes security ${player.minutesSecurity.toFixed(2)}`,
  ];
  if (player.penaltiesOrder === 1) {
    reasons.push("Listed first for penalties");
  }
  if (player.availabilityRisk >= 0.4) {
    reasons.push("Availability risk is elevated");
  }
  return reasons;
}

export function captainConfidence(
  captainValue: number,
  viceValue: number,
  availabilityRisk: number,
): Confidence {
  if (availabilityRisk >= 0.55) {
    return "LOW";
  }
  if (availabilityRisk >= 0.28) {
    return "MEDIUM";
  }
  const gap = captainValue - viceValue;
  if (gap >= 0.08) {
    return "HIGH";
  }
  if (gap >= 0.03) {
    return "MEDIUM";
  }
  return "LOW";
}

export function selectCaptaincy(recommendedXi: PlayerAnalysis[]): {
  captain: RolePick;
  viceCaptain: RolePick;
} {
  const ranked = [...recommendedXi].sort((left, right) => {
    const delta = captainScore(right) - captainScore(left);
    return delta !== 0 ? delta : left.playerId - right.playerId;
  });

  const captainPlayer = ranked[0];
  const vicePlayer = ranked[1] ?? ranked[0];

  if (!captainPlayer || !vicePlayer) {
    throw new Error("Unable to select captaincy from the recommended XI.");
  }

  const captainValue = captainScore(captainPlayer);
  const viceValue = captainScore(vicePlayer);

  return {
    captain: {
      player: captainPlayer,
      score: captainValue,
      reasons: captainReasons(captainPlayer, captainValue),
      confidence: captainConfidence(
        captainValue,
        viceValue,
        captainPlayer.availabilityRisk,
      ),
    },
    viceCaptain: {
      player: vicePlayer,
      score: viceValue,
      reasons: [
        `Second-best captain score (${viceValue.toFixed(2)}) in the recommended XI`,
        ...captainReasons(vicePlayer, viceValue).slice(1),
      ],
      confidence: captainConfidence(
        viceValue,
        ranked[2] ? captainScore(ranked[2]) : 0,
        vicePlayer.availabilityRisk,
      ),
    },
  };
}
