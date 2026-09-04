import { riskLevelFromScores } from "@/lib/analysis/risk";
import type { Player } from "@/lib/fpl/types";
import type {
  AvailabilitySignal,
  IntelligenceSource,
  PlayerIntelligence,
} from "./types";

function chanceToRisk(chance: number | null | undefined): "LOW" | "MEDIUM" | "HIGH" {
  if (chance == null) {
    return "LOW";
  }
  if (chance <= 25) {
    return "HIGH";
  }
  if (chance <= 50) {
    return "MEDIUM";
  }
  return "LOW";
}

export function buildAvailabilitySignal(player: Player): AvailabilitySignal {
  const chance = player.chanceOfPlaying ?? player.chanceOfPlayingThis;
  const risk = chanceToRisk(chance);
  const reason =
    player.news ||
    (chance != null ? `${chance}% chance of playing` : "No FPL availability flags");

  return {
    playerId: player.id,
    risk,
    reason,
    source: "FPL",
    confidence: chance != null ? 0.95 : player.news ? 0.85 : 0.6,
    detectedAt: new Date().toISOString(),
  };
}

export function buildAvailabilitySignals(players: Player[]): AvailabilitySignal[] {
  return players
    .map(buildAvailabilitySignal)
    .filter((signal) => signal.risk !== "LOW" || signal.reason !== "No FPL availability flags");
}

export function buildPlayerIntelligence(
  player: Player,
  externalSources: IntelligenceSource[] = [],
  uncertainty: "LOW" | "MEDIUM" | "HIGH" = "LOW",
): PlayerIntelligence {
  const signal = buildAvailabilitySignal(player);
  const suspension =
    player.news.toLowerCase().includes("suspend") || player.status === "s"
      ? { active: true, reason: player.news || "Suspended per FPL status" }
      : undefined;

  const sources: IntelligenceSource[] = [
    {
      name: "FPL",
      confidence: signal.confidence,
      publishedAt: new Date().toISOString(),
    },
    ...externalSources,
  ];

  return {
    playerId: player.id,
    availability: {
      risk: signal.risk,
      reason: signal.reason,
      confidence: signal.confidence,
    },
    suspension,
    minutesRisk: riskLevelFromScores(0, player.minutes < 180 && player.starts < 3 ? 0.45 : 0.1),
    sources,
    uncertainty,
  };
}

export function intelligenceAvailabilityAdjustment(
  intelligence?: PlayerIntelligence,
): number {
  if (!intelligence) {
    return 0;
  }

  let adjustment = 0;
  if (intelligence.uncertainty === "HIGH") {
    adjustment += 0.12;
  } else if (intelligence.uncertainty === "MEDIUM") {
    adjustment += 0.06;
  }

  if (intelligence.suspension?.active) {
    adjustment = Math.max(adjustment, 0.15);
  }

  return Math.min(adjustment, 0.15);
}
