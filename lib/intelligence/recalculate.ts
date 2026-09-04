import type { PlayerIntelligence } from "./types";

function availabilityScore(player: PlayerIntelligence): number {
  const riskScore =
    player.availability.risk === "HIGH"
      ? 3
      : player.availability.risk === "MEDIUM"
        ? 2
        : 1;
  const uncertaintyScore =
    player.uncertainty === "HIGH" ? 3 : player.uncertainty === "MEDIUM" ? 2 : 1;
  const chanceComponent = player.availability.confidence < 0.7 ? 1 : 0;
  return riskScore + uncertaintyScore + chanceComponent;
}

export function shouldRecalculate(
  previous: PlayerIntelligence | undefined,
  current: PlayerIntelligence,
): boolean {
  if (!previous) {
    return current.availability.risk !== "LOW" || current.uncertainty !== "LOW";
  }

  const previousChance = chanceFromRisk(previous.availability.risk);
  const currentChance = chanceFromRisk(current.availability.risk);

  if (Math.abs(previousChance - currentChance) >= 50) {
    return true;
  }

  if (previous.uncertainty !== current.uncertainty && current.uncertainty !== "LOW") {
    return true;
  }

  if (Boolean(previous.suspension?.active) !== Boolean(current.suspension?.active)) {
    return true;
  }

  if (
    availabilityScore(current) - availabilityScore(previous) >= 2 &&
    current.availability.risk !== "LOW"
  ) {
    return true;
  }

  return false;
}

export function shouldRecalculateSquad(
  previousPlayers: PlayerIntelligence[],
  currentPlayers: PlayerIntelligence[],
): { shouldRecalculate: boolean; reason?: string } {
  const previousById = new Map(previousPlayers.map((player) => [player.playerId, player]));

  for (const current of currentPlayers) {
    const previous = previousById.get(current.playerId);
    if (shouldRecalculate(previous, current)) {
      const reason = previous
        ? `Meaningful availability change detected for player ${current.playerId}`
        : `New availability signal for player ${current.playerId}`;
      return { shouldRecalculate: true, reason };
    }
  }

  return { shouldRecalculate: false };
}

function chanceFromRisk(risk: "LOW" | "MEDIUM" | "HIGH"): number {
  switch (risk) {
    case "HIGH":
      return 25;
    case "MEDIUM":
      return 50;
    default:
      return 100;
  }
}
