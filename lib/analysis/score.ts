import { PLAYER_SCORE_WEIGHTS, TRANSFER_SCORE_WEIGHTS } from "./config";
import { clamp01 } from "./risk";
import type { PlayerAnalysis } from "./types";
import type { Position } from "@/lib/fpl/types";

export function attackingPotential(
  position: Position,
  expectedGoalInvolvement: number,
  form: number,
): number {
  if (position === "GK") {
    return 0.15;
  }
  if (position === "DEF") {
    return clamp01(expectedGoalInvolvement / 1.2 + form / 30);
  }
  return clamp01(expectedGoalInvolvement / 2);
}

export function overallScoreFromParts(parts: {
  expectedPoints: number;
  fixtureScore: number;
  form: number;
  minutesSecurity: number;
  attackingPotential: number;
  availabilityRisk: number;
}): number {
  const w = PLAYER_SCORE_WEIGHTS;
  const value =
    w.expectedPoints * clamp01(parts.expectedPoints / 8) +
    w.fixtureQuality * parts.fixtureScore +
    w.form * clamp01(parts.form / 10) +
    w.minutesSecurity * parts.minutesSecurity +
    w.attackingPotential * parts.attackingPotential +
    w.availability * (1 - parts.availabilityRisk);
  return Number(value.toFixed(4));
}

export function transferScoreFromParts(parts: {
  expectedPoints: number;
  fixtureScore: number;
  form: number;
  minutesSecurity: number;
  expectedGoalInvolvement: number;
  price: number;
  mediumTermFixtures: number;
  availabilityRisk: number;
}): number {
  const w = TRANSFER_SCORE_WEIGHTS;
  const valuePerMillion = parts.expectedPoints / Math.max(parts.price, 4);
  const value =
    w.expectedPoints * clamp01(parts.expectedPoints / 8) +
    w.fixtureQuality * parts.fixtureScore +
    w.form * clamp01(parts.form / 10) +
    w.minutesSecurity * parts.minutesSecurity +
    w.expectedGoalInvolvement * clamp01(parts.expectedGoalInvolvement / 2) +
    w.value * clamp01(valuePerMillion / 0.8) +
    w.mediumTermFixtures * parts.mediumTermFixtures +
    w.availability * (1 - parts.availabilityRisk);
  return Number(value.toFixed(4));
}

export function compareByOverallScore(
  left: PlayerAnalysis,
  right: PlayerAnalysis,
): number {
  if (right.overallScore !== left.overallScore) {
    return right.overallScore - left.overallScore;
  }
  return left.playerId - right.playerId;
}
