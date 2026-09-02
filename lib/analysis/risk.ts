import type { Player } from "@/lib/fpl/types";
import type { PlayerAnalysis, RiskLevel } from "./types";

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

export function availabilityRiskFromPlayer(player: Player): number {
  const news = player.news.toLowerCase();
  let risk = 0;

  if (player.status === "i" || player.status === "s" || player.status === "u") {
    risk = Math.max(risk, 0.95);
  } else if (player.status === "d" || player.status === "n") {
    risk = Math.max(risk, 0.55);
  }

  const chance = player.chanceOfPlaying ?? player.chanceOfPlayingThis;
  if (chance != null) {
    risk = Math.max(risk, clamp01(1 - chance / 100));
  }

  if (news.includes("suspend")) {
    risk = Math.max(risk, 0.95);
  } else if (
    news.includes("injur") ||
    news.includes("knock") ||
    news.includes("unavail")
  ) {
    risk = Math.max(risk, 0.7);
  } else if (news.includes("doubt") || news.includes("illness")) {
    risk = Math.max(risk, 0.45);
  }

  return Number(risk.toFixed(4));
}

export function minutesRiskFromPlayer(player: Player): number {
  const starts = Math.max(player.starts, 0);
  const minutes = Math.max(player.minutes, 0);

  if (starts === 0 && minutes === 0) {
    return 0.55;
  }

  const expectedMinutes = Math.max(starts, 1) * 90;
  const share = clamp01(minutes / expectedMinutes);
  const startRatePenalty = starts > 0 && minutes / starts < 60 ? 0.2 : 0;
  return Number(clamp01(1 - share + startRatePenalty).toFixed(4));
}

export function minutesSecurityFromRisk(minutesRisk: number): number {
  return Number((1 - minutesRisk).toFixed(4));
}

export function riskLevelFromScores(
  availabilityRisk: number,
  minutesRisk: number,
): RiskLevel {
  const combined = Math.max(availabilityRisk, minutesRisk * 0.85);
  if (combined >= 0.55) {
    return "HIGH";
  }
  if (combined >= 0.28) {
    return "MEDIUM";
  }
  return "LOW";
}

export function riskReasons(player: PlayerAnalysis): string[] {
  const reasons: string[] = [];
  if (player.chanceOfPlaying != null && player.chanceOfPlaying < 100) {
    reasons.push(`${player.chanceOfPlaying}% chance of playing next round`);
  }
  if (player.news) {
    reasons.push(player.news);
  }
  if (player.minutesRisk >= 0.4) {
    reasons.push("Minutes look insecure from recent starts");
  }
  if (player.availabilityRisk >= 0.5) {
    reasons.push("Availability flagged from FPL status or news");
  }
  if (reasons.length === 0) {
    reasons.push("No material availability flags in FPL data");
  }
  return reasons;
}
