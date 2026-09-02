import { compareByOverallScore } from "./score";
import type { PlayerAnalysis } from "./types";

export function benchScore(player: PlayerAnalysis): number {
  return Number(
    (
      0.4 * player.expectedPointsNext / 8 +
      0.25 * player.minutesSecurity +
      0.2 * player.fixtureScore +
      0.15 * (1 - player.availabilityRisk)
    ).toFixed(4),
  );
}

export function orderBench(
  squad: PlayerAnalysis[],
  recommendedXi: PlayerAnalysis[],
): PlayerAnalysis[] {
  const xiIds = new Set(recommendedXi.map((player) => player.playerId));
  const remaining = squad.filter((player) => !xiIds.has(player.playerId));
  const goalkeepers = remaining
    .filter((player) => player.position === "GK")
    .sort(compareByOverallScore);
  const outfield = remaining
    .filter((player) => player.position !== "GK")
    .sort((left, right) => {
      const delta = benchScore(right) - benchScore(left);
      return delta !== 0 ? delta : left.playerId - right.playerId;
    });

  return [...goalkeepers, ...outfield];
}
