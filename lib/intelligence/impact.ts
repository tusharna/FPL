import type { ImpactLevel, DecisionArea, DecisionImpact, IntelligenceAlert, PlayerIntelligence, PriceSignal } from "./types";

type ImpactInput = {
  players: PlayerIntelligence[];
  captainId?: number;
  viceCaptainId?: number;
  transferPlayerIds?: number[];
  recommendedXiIds?: number[];
  priceSignals: PriceSignal[];
  playerNames: Map<number, string>;
};

export function calculateDecisionImpacts(input: ImpactInput): DecisionImpact[] {
  return input.players.map((player) => {
    const areas: DecisionArea[] = [];
    const reasons: string[] = [];
    let impact: ImpactLevel = "NONE";

    if (player.availability.risk === "HIGH" || player.uncertainty === "HIGH") {
      impact = "HIGH";
      reasons.push(player.availability.reason ?? "High availability risk");
      areas.push("START_XI", "BENCH");
      if (player.playerId === input.captainId) {
        areas.push("CAPTAIN");
      }
      if (player.playerId === input.viceCaptainId) {
        areas.push("VICE_CAPTAIN");
      }
      if (input.transferPlayerIds?.includes(player.playerId)) {
        areas.push("TRANSFER");
      }
    } else if (player.availability.risk === "MEDIUM" || player.uncertainty === "MEDIUM") {
      impact = "MEDIUM";
      reasons.push(player.availability.reason ?? "Availability concern");
      if (input.recommendedXiIds?.includes(player.playerId)) {
        areas.push("START_XI");
      }
      if (player.playerId === input.captainId) {
        areas.push("CAPTAIN");
      }
    }

    const priceSignal = input.priceSignals.find((signal) => signal.playerId === player.playerId);
    if (priceSignal && priceSignal.direction !== "STABLE") {
      if (impact === "NONE") {
        impact = "LOW";
      }
      reasons.push(`Observed price change: ${priceSignal.reason}`);
      if (input.transferPlayerIds?.includes(player.playerId)) {
        areas.push("TRANSFER");
      }
    }

    return {
      playerId: player.playerId,
      impact,
      affectedAreas: [...new Set(areas)],
      reasons,
    };
  });
}

export function buildKeyAlerts(
  impacts: DecisionImpact[],
  playerNames: Map<number, string>,
): IntelligenceAlert[] {
  return impacts
    .filter((impact) => impact.impact !== "NONE")
    .sort((left, right) => impactRank(right.impact) - impactRank(left.impact))
    .slice(0, 12)
    .map((impact) => ({
      playerId: impact.playerId,
      player: playerNames.get(impact.playerId) ?? `Player ${impact.playerId}`,
      type: impact.affectedAreas.join(", ") || "Availability",
      severity:
        impact.impact === "HIGH"
          ? "HIGH"
          : impact.impact === "MEDIUM"
            ? "MEDIUM"
            : "LOW",
      explanation: impact.reasons[0] ?? "Intelligence signal detected",
    }));
}

function impactRank(impact: ImpactLevel): number {
  switch (impact) {
    case "HIGH":
      return 3;
    case "MEDIUM":
      return 2;
    case "LOW":
      return 1;
    default:
      return 0;
  }
}
