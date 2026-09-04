import { buildDedupeKey, isDuplicate } from "./dedupe";
import {
  formatAvailabilityNotification,
  formatCaptainChangeNotification,
  formatCaptainRiskNotification,
  formatDeadlineReminderNotification,
  formatFixtureNotification,
  formatLineupChangeNotification,
  formatPriceChangeNotification,
  formatTransferChangeNotification,
  playerName,
} from "./formatter";
import { isTypeEnabled, meetsMinimumSeverity } from "./preferences";
import { severityForType } from "./severity";
import type {
  EvaluateContext,
  Notification,
  NotificationPreferences,
  NotificationState,
} from "./types";

const AVAILABILITY_THRESHOLD = 25;

function relevantPlayerIds(state: NotificationState): Set<number> {
  const ids = new Set(state.recommendedXI);
  if (state.captainId) ids.add(state.captainId);
  if (state.viceCaptainId) ids.add(state.viceCaptainId);
  if (state.transferInId) ids.add(state.transferInId);
  if (state.transferOutId) ids.add(state.transferOutId);
  return ids;
}

function xiChanged(previous: number[], current: number[]): boolean {
  if (previous.length !== current.length) return true;
  const prevSet = new Set(previous);
  return current.some((id) => !prevSet.has(id));
}

function availabilityMeaningfullyChanged(
  previous: number | null | undefined,
  current: number | null | undefined,
): boolean {
  const prev = previous ?? 100;
  const curr = current ?? 100;
  if (prev === curr) return false;
  if (prev >= 75 && curr < 75) return true;
  if (prev >= 50 && curr < 50) return true;
  if (Math.abs(prev - curr) >= AVAILABILITY_THRESHOLD) return true;
  return false;
}

function riskIncreased(
  previous: string | undefined,
  current: string,
): boolean {
  const rank = { LOW: 0, MEDIUM: 1, HIGH: 2 };
  const prevRank = rank[(previous as keyof typeof rank) ?? "LOW"] ?? 0;
  const currRank = rank[(current as keyof typeof rank) ?? "LOW"] ?? 0;
  return currRank > prevRank;
}

function filterNotification(
  notification: Notification,
  preferences: NotificationPreferences,
  existingKeys: Set<string>,
): Notification | null {
  if (!isTypeEnabled(notification.type, preferences)) {
    return null;
  }
  if (!meetsMinimumSeverity(notification.severity, preferences.minimumSeverity)) {
    return null;
  }
  if (isDuplicate(notification.dedupeKey, existingKeys)) {
    return null;
  }
  return notification;
}

export function evaluateNotifications(
  previousState: NotificationState | null,
  currentState: NotificationState,
  preferences: NotificationPreferences,
  existingDedupeKeys: Set<string> = new Set(),
  context: EvaluateContext = { playerNames: new Map() },
): Notification[] {
  const notifications: Notification[] = [];
  const gw = currentState.gameweek;
  const relevant = relevantPlayerIds(currentState);

  if (!previousState) {
    return notifications;
  }

  if (
    previousState.captainId !== currentState.captainId &&
    currentState.captainId
  ) {
    const dedupeKey = buildDedupeKey(gw, "CAPTAIN_CHANGE", [
      `player-${currentState.captainId}`,
    ]);
    const formatted = formatCaptainChangeNotification(
      playerName(context.playerNames, previousState.captainId ?? 0),
      playerName(context.playerNames, currentState.captainId),
      "Captain recommendation changed based on deterministic analysis.",
      context.deadline,
    );
    const notification: Notification = {
      type: "CAPTAIN_CHANGE",
      severity: severityForType("CAPTAIN_CHANGE"),
      title: formatted.title,
      message: formatted.message,
      gameweek: gw,
      playerId: currentState.captainId,
      actionRequired: true,
      dedupeKey,
    };
    const filtered = filterNotification(notification, preferences, existingDedupeKeys);
    if (filtered) notifications.push(filtered);
  }

  if (currentState.captainId) {
    const prevRisk = previousState.playerRisks[currentState.captainId];
    const currRisk = currentState.playerRisks[currentState.captainId] ?? "LOW";
    const prevAvail = previousState.playerAvailability[currentState.captainId];
    const currAvail = currentState.playerAvailability[currentState.captainId];

    const captainRisky =
      currRisk === "HIGH" ||
      (riskIncreased(prevRisk, currRisk) && currRisk !== "LOW") ||
      availabilityMeaningfullyChanged(prevAvail, currAvail);

    if (
      captainRisky &&
      previousState.captainId === currentState.captainId
    ) {
      const dedupeKey = buildDedupeKey(gw, "CAPTAIN_RISK", [
        `player-${currentState.captainId}`,
        currRisk,
      ]);
      const availText =
        currAvail != null ? `${currAvail}% chance of playing` : "availability concern";
      const formatted = formatCaptainRiskNotification(
        playerName(context.playerNames, currentState.captainId),
        `Status: ${availText}. Risk level: ${currRisk}.`,
        context.deadline,
      );
      const notification: Notification = {
        type: "CAPTAIN_RISK",
        severity: severityForType("CAPTAIN_RISK", {
          isHighRisk: currRisk === "HIGH",
          actionRequired: true,
        }),
        title: formatted.title,
        message: formatted.message,
        gameweek: gw,
        playerId: currentState.captainId,
        actionRequired: true,
        dedupeKey,
      };
      const filtered = filterNotification(notification, preferences, existingDedupeKeys);
      if (filtered) notifications.push(filtered);
    }
  }

  if (xiChanged(previousState.recommendedXI, currentState.recommendedXI)) {
    const prevSet = new Set(previousState.recommendedXI);
    const currSet = new Set(currentState.recommendedXI);
    const outIds = previousState.recommendedXI.filter((id) => !currSet.has(id));
    const inIds = currentState.recommendedXI.filter((id) => !prevSet.has(id));

    const dedupeKey = buildDedupeKey(gw, "LINEUP_CHANGE", [
      inIds.join("-") || "change",
    ]);
    const formatted = formatLineupChangeNotification(
      outIds.map((id) => playerName(context.playerNames, id)),
      inIds.map((id) => playerName(context.playerNames, id)),
      "Recommended XI changed due to availability or fixture factors.",
    );
    const notification: Notification = {
      type: "LINEUP_CHANGE",
      severity: severityForType("LINEUP_CHANGE"),
      title: formatted.title,
      message: formatted.message,
      gameweek: gw,
      actionRequired: false,
      dedupeKey,
    };
    const filtered = filterNotification(notification, preferences, existingDedupeKeys);
    if (filtered) notifications.push(filtered);
  }

  const transferChanged =
    previousState.transferAction !== currentState.transferAction ||
    (currentState.transferAction === "TRANSFER" &&
      (previousState.transferInId !== currentState.transferInId ||
        previousState.transferOutId !== currentState.transferOutId));

  if (
    transferChanged &&
    currentState.transferAction === "TRANSFER" &&
    currentState.transferInId &&
    currentState.transferOutId
  ) {
    const dedupeKey = buildDedupeKey(gw, "TRANSFER_CHANGE", [
      `out-${currentState.transferOutId}`,
      `in-${currentState.transferInId}`,
    ]);
    const formatted = formatTransferChangeNotification(
      playerName(context.playerNames, currentState.transferOutId),
      playerName(context.playerNames, currentState.transferInId),
      "Transfer recommendation changed based on deterministic analysis.",
    );
    const notification: Notification = {
      type: "TRANSFER_CHANGE",
      severity: severityForType("TRANSFER_CHANGE"),
      title: formatted.title,
      message: formatted.message,
      gameweek: gw,
      playerId: currentState.transferInId,
      actionRequired: true,
      dedupeKey,
    };
    const filtered = filterNotification(notification, preferences, existingDedupeKeys);
    if (filtered) notifications.push(filtered);
  }

  for (const playerId of relevant) {
    const prevAvail = previousState.playerAvailability[playerId];
    const currAvail = currentState.playerAvailability[playerId];

    if (!availabilityMeaningfullyChanged(prevAvail, currAvail)) {
      continue;
    }

    if (playerId === currentState.captainId) {
      continue;
    }

    const dedupeKey = buildDedupeKey(gw, "PLAYER_AVAILABILITY", [
      `player-${playerId}`,
      String(currAvail ?? "unknown"),
    ]);
    const xiChangedFlag = xiChanged(previousState.recommendedXI, currentState.recommendedXI);
    const formatted = formatAvailabilityNotification(
      playerName(context.playerNames, playerId),
      currAvail != null ? `${currAvail}% chance of playing` : "availability concern",
      currentState.playerRisks[playerId] ?? "MEDIUM",
      xiChangedFlag,
    );
    const notification: Notification = {
      type: "PLAYER_AVAILABILITY",
      severity: severityForType("PLAYER_AVAILABILITY", {
        isHighRisk: (currentState.playerRisks[playerId] ?? "LOW") === "HIGH",
      }),
      title: formatted.title,
      message: formatted.message,
      gameweek: gw,
      playerId,
      actionRequired: false,
      dedupeKey,
    };
    const filtered = filterNotification(notification, preferences, existingDedupeKeys);
    if (filtered) notifications.push(filtered);
  }

  const prevFixtures = new Set(previousState.fixtureKeys);
  for (const key of currentState.fixtureKeys) {
    if (prevFixtures.has(key)) continue;

    const parts = key.split(":");
    const changeType = parts[1] ?? "FIXTURE_CHANGE";
    const affectedIds = context.intelligenceFixtureChanges
      ?.flatMap((change) =>
        `${change.fixtureId}:${change.type}` === `${parts[0]}:${parts[1]}`
          ? change.affectedPlayerIds
          : [],
      )
      .filter((id) => relevant.has(id)) ?? [];

    if (affectedIds.length === 0 && !["BLANK", "DOUBLE"].includes(changeType)) {
      continue;
    }

    let type: Notification["type"] = "FIXTURE_CHANGE";
    if (changeType === "DOUBLE") type = "DOUBLE_GAMEWEEK";
    if (changeType === "BLANK") type = "BLANK_GAMEWEEK";

    const dedupeKey = buildDedupeKey(gw, type, [key]);
    const formatted = formatFixtureNotification(
      `Fixture change detected: ${changeType}`,
      affectedIds.map((id) => playerName(context.playerNames, id)),
      affectedIds.length > 0 ? "Medium" : "Low",
    );
    const notification: Notification = {
      type,
      severity: severityForType(type),
      title: formatted.title,
      message: formatted.message,
      gameweek: gw,
      actionRequired: false,
      dedupeKey,
    };
    const filtered = filterNotification(notification, preferences, existingDedupeKeys);
    if (filtered) notifications.push(filtered);
  }

  if (preferences.priceAlerts) {
    for (const [playerIdStr, currentPrice] of Object.entries(currentState.priceChanges)) {
      const playerId = Number(playerIdStr);
      if (!relevant.has(playerId)) continue;

      const prevPrice = previousState.priceChanges[playerId];
      if (prevPrice === currentPrice) continue;

      const dedupeKey = buildDedupeKey(gw, "PRICE_CHANGE", [
        `player-${playerId}`,
        String(currentPrice),
      ]);
      const formatted = formatPriceChangeNotification(
        playerName(context.playerNames, playerId),
        prevPrice ?? currentPrice,
        currentPrice,
      );
      const notification: Notification = {
        type: "PRICE_CHANGE",
        severity: severityForType("PRICE_CHANGE"),
        title: formatted.title,
        message: formatted.message,
        gameweek: gw,
        playerId,
        actionRequired: false,
        dedupeKey,
      };
      const filtered = filterNotification(notification, preferences, existingDedupeKeys);
      if (filtered) notifications.push(filtered);
    }
  }

  return notifications;
}

export function evaluateDeadlineReminders(
  gameweek: number,
  deadline: string,
  isFinished: boolean,
  captainName: string,
  transferAction: string,
  riskLine?: string,
  preferences?: NotificationPreferences,
  existingDedupeKeys: Set<string> = new Set(),
): Notification[] {
  if (isFinished || !preferences?.deadlineReminders) {
    return [];
  }

  const deadlineDate = new Date(deadline);
  const now = Date.now();
  const hoursRemaining = (deadlineDate.getTime() - now) / (1000 * 60 * 60);

  if (hoursRemaining <= 0) {
    return [];
  }

  const windows: { key: string; min: number; max: number }[] = [
    { key: "24H", min: 2, max: 26 },
    { key: "2H", min: 0.5, max: 3 },
  ];

  const notifications: Notification[] = [];

  for (const window of windows) {
    if (hoursRemaining < window.min || hoursRemaining > window.max) {
      continue;
    }

    const dedupeKey = buildDedupeKey(gameweek, "DEADLINE_REMINDER", [window.key]);
    if (isDuplicate(dedupeKey, existingDedupeKeys)) {
      continue;
    }

    const formatted = formatDeadlineReminderNotification(
      gameweek,
      hoursRemaining,
      captainName,
      transferAction,
      riskLine,
      deadline,
    );

    const notification: Notification = {
      type: "DEADLINE_REMINDER",
      severity: severityForType("DEADLINE_REMINDER", { actionRequired: true }),
      title: formatted.title,
      message: formatted.message,
      gameweek,
      actionRequired: true,
      dedupeKey,
    };

    if (
      preferences &&
      meetsMinimumSeverity(notification.severity, preferences.minimumSeverity)
    ) {
      notifications.push(notification);
    }
  }

  return notifications;
}

export function createGameweekReportNotification(
  gameweek: number,
  title: string,
  message: string,
  existingDedupeKeys: Set<string> = new Set(),
): Notification | null {
  const dedupeKey = buildDedupeKey(gameweek, "GAMEWEEK_REPORT");
  if (isDuplicate(dedupeKey, existingDedupeKeys)) {
    return null;
  }
  return {
    type: "GAMEWEEK_REPORT",
    severity: severityForType("GAMEWEEK_REPORT"),
    title,
    message,
    gameweek,
    actionRequired: false,
    dedupeKey,
  };
}
