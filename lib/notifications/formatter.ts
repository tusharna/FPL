import type { GameweekAnalysis } from "@/lib/analysis/types";
import type { IntelligenceBundle } from "@/lib/intelligence/types";
import { formatDeadline, formatPrice } from "@/lib/format";
import type { Notification, NotificationState } from "./types";

export function buildNotificationState(
  analysis: GameweekAnalysis,
  intelligence?: IntelligenceBundle,
): NotificationState {
  const playerRisks: Record<number, string> = {};
  const playerAvailability: Record<number, number | null> = {};

  for (const risk of analysis.playerRisks) {
    playerRisks[risk.player.playerId] = risk.risk;
    playerAvailability[risk.player.playerId] = risk.player.chanceOfPlaying;
  }

  for (const player of analysis.recommendedXI) {
    if (!(player.playerId in playerAvailability)) {
      playerAvailability[player.playerId] = player.chanceOfPlaying;
    }
    if (!(player.playerId in playerRisks)) {
      playerRisks[player.playerId] = "LOW";
    }
  }

  const fixtureKeys: string[] = [];
  if (intelligence) {
    for (const change of intelligence.fixtureChanges) {
      fixtureKeys.push(`${change.fixtureId}:${change.type}:${change.newValue ?? ""}`);
    }
  }

  const priceChanges: Record<number, number> = {};
  if (intelligence) {
    for (const signal of intelligence.priceSignals) {
      if (signal.direction !== "STABLE" && signal.previousPrice != null) {
        priceChanges[signal.playerId] = signal.currentPrice;
      }
    }
  }

  return {
    gameweek: analysis.gameweek,
    captainId: analysis.captain.player.playerId,
    viceCaptainId: analysis.viceCaptain.player.playerId,
    recommendedXI: analysis.recommendedXI.map((player) => player.playerId),
    transferAction: analysis.transferRecommendation.action,
    transferInId: analysis.transferRecommendation.playerIn?.playerId,
    transferOutId: analysis.transferRecommendation.playerOut?.playerId,
    playerRisks,
    playerAvailability,
    fixtureKeys,
    priceChanges,
  };
}

export function formatGameweekReportNotification(
  analysis: GameweekAnalysis,
  deadline?: string | null,
): Pick<Notification, "title" | "message"> {
  const keyRisk = analysis.playerRisks.find((risk) => risk.risk !== "LOW");
  const transfer = analysis.transferRecommendation;

  const lines = [
    `GW${analysis.gameweek} FPL Report`,
    "",
    `Formation: ${analysis.recommendedFormation}`,
    `Captain: ${analysis.captain.player.webName}`,
    `Vice-captain: ${analysis.viceCaptain.player.webName}`,
    `Transfer: ${transfer.action}${transfer.playerIn ? ` — ${transfer.playerOut?.webName} → ${transfer.playerIn.webName}` : ""}`,
    "",
    keyRisk
      ? `Key risk:\n${keyRisk.player.webName} — ${keyRisk.reasons[0] ?? "availability concern"}`
      : "Key risk: None flagged",
    "",
    `Deadline:\n${formatDeadline(deadline ?? null)}`,
  ];

  return {
    title: `GW${analysis.gameweek} FPL Report`,
    message: lines.join("\n"),
  };
}

export function formatManualReportEmailMessage(
  analysis: GameweekAnalysis,
  executiveSummary: string,
  finalVerdict: string,
  deadline?: string | null,
): Pick<Notification, "title" | "message"> {
  const base = formatGameweekReportNotification(analysis, deadline);
  const message = [
    base.message,
    "",
    "Summary:",
    executiveSummary,
    "",
    "Verdict:",
    finalVerdict,
  ].join("\n");

  return {
    title: base.title,
    message,
  };
}

export function formatCaptainChangeNotification(
  previousName: string,
  newName: string,
  reason: string,
  deadline?: string | null,
): Pick<Notification, "title" | "message"> {
  return {
    title: "Captain Alert",
    message: [
      "Captain Alert",
      "",
      `Previous: ${previousName}`,
      `New: ${newName}`,
      "",
      "Reason:",
      reason,
      "",
      `Deadline:\n${formatDeadline(deadline ?? null)}`,
    ].join("\n"),
  };
}

export function formatCaptainRiskNotification(
  captainName: string,
  reason: string,
  deadline?: string | null,
): Pick<Notification, "title" | "message"> {
  return {
    title: "Captain Risk Alert",
    message: [
      "Captain Risk Alert",
      "",
      `Captain: ${captainName}`,
      reason,
      "",
      `Deadline:\n${formatDeadline(deadline ?? null)}`,
    ].join("\n"),
  };
}

export function formatLineupChangeNotification(
  outNames: string[],
  inNames: string[],
  reason: string,
): Pick<Notification, "title" | "message"> {
  return {
    title: "Lineup Alert",
    message: [
      "Lineup Alert",
      "",
      "The recommended XI has changed.",
      "",
      "OUT:",
      ...outNames.map((name) => name),
      "",
      "IN:",
      ...inNames.map((name) => name),
      "",
      "Reason:",
      reason,
    ].join("\n"),
  };
}

export function formatTransferChangeNotification(
  outName: string,
  inName: string,
  reason: string,
): Pick<Notification, "title" | "message"> {
  return {
    title: "Transfer Alert",
    message: [
      "Transfer Alert",
      "",
      "The model now recommends a transfer.",
      "",
      "OUT:",
      outName,
      "",
      "IN:",
      inName,
      "",
      "Reason:",
      reason,
    ].join("\n"),
  };
}

export function formatAvailabilityNotification(
  playerName: string,
  status: string,
  impact: string,
  xiChanged: boolean,
): Pick<Notification, "title" | "message"> {
  const lines = [
    "Availability Alert",
    "",
    `Player: ${playerName}`,
    `Status: ${status}`,
    "",
    `Impact:\n${impact}`,
  ];

  if (!xiChanged) {
    lines.push("", "The model has not changed the XI yet.");
  }

  return {
    title: "Availability Alert",
    message: lines.join("\n"),
  };
}

export function formatFixtureNotification(
  headline: string,
  affectedPlayers: string[],
  impact: string,
): Pick<Notification, "title" | "message"> {
  return {
    title: "Fixture Alert",
    message: [
      "Fixture Alert",
      "",
      headline,
      "",
      "Players affected in your analysis:",
      ...affectedPlayers,
      "",
      `Captain/transfer impact: ${impact}`,
    ].join("\n"),
  };
}

export function formatPriceChangeNotification(
  playerName: string,
  previousPrice: number,
  currentPrice: number,
): Pick<Notification, "title" | "message"> {
  return {
    title: "Price Update",
    message: [
      "Price Update",
      "",
      `${playerName} changed from ${formatPrice(previousPrice)} to ${formatPrice(currentPrice)}.`,
    ].join("\n"),
  };
}

export function formatDeadlineReminderNotification(
  gameweek: number,
  hoursRemaining: number,
  captainName: string,
  transferAction: string,
  riskLine?: string,
  deadline?: string | null,
): Pick<Notification, "title" | "message"> {
  const timeLabel =
    hoursRemaining >= 24
      ? `${Math.round(hoursRemaining)} hours`
      : hoursRemaining >= 1
        ? `${Math.round(hoursRemaining)} hours`
        : `${Math.round(hoursRemaining * 60)} minutes`;

  const lines = [
    "FPL Deadline",
    "",
    `GW${gameweek} deadline is in ${timeLabel}.`,
    "",
    `Captain: ${captainName}`,
    `Transfer: ${transferAction}`,
  ];

  if (riskLine) {
    lines.push(`Risk: ${riskLine}`);
  }

  if (deadline) {
    lines.push("", `Deadline: ${formatDeadline(deadline)}`);
  }

  lines.push("", "Open your FPL report.");

  return {
    title: "FPL Deadline Reminder",
    message: lines.join("\n"),
  };
}

export function playerName(
  playerNames: Map<number, string>,
  playerId: number,
): string {
  return playerNames.get(playerId) ?? `Player ${playerId}`;
}
