import { currentAnalysisPlayers, toAIReportInput } from "@/lib/ai/input";
import { generateGameweekReport } from "@/lib/ai/report";
import { getBootstrapStatic } from "@/lib/fpl/bootstrap";
import { getDashboardData } from "@/lib/fpl/dashboard-data";
import { getEntryId } from "@/lib/fpl/client";
import { indexById, normalizePlayer } from "@/lib/fpl/normalize";
import { persistGameweekReport } from "@/lib/history";
import { dispatchNotifications, processPendingDeliveries } from "./dispatcher";
import { buildNotificationState, formatGameweekReportNotification } from "./formatter";
import {
  loadExistingDedupeKeys,
  loadNotificationState,
  loadPreferences,
  saveNotificationState,
} from "./persist";
import {
  createGameweekReportNotification,
  evaluateDeadlineReminders,
  evaluateNotifications,
} from "./rules";
import type { EvaluateContext, Notification } from "./types";

export type NotificationRunResult = {
  entryId: number;
  gameweek: number;
  notificationsCreated: number;
  deliveries: number;
  pendingProcessed: number;
};

function buildEvaluateContext(
  data: Awaited<ReturnType<typeof getDashboardData>>,
): EvaluateContext {
  const playerNames = new Map(
    data.squad.map((player) => [player.id, player.webName]),
  );

  const squadIds = new Set(data.squad.map((player) => player.id));
  const intelligenceFixtureChanges = data.intelligence.fixtureChanges.map(
    (change) => ({
      fixtureId: change.fixtureId,
      type: change.type,
      affectedPlayerIds: data.squad
        .filter((player) => squadIds.has(player.id))
        .map((player) => player.id),
    }),
  );

  return {
    deadline: data.gameweek.deadline,
    playerNames,
    intelligenceFixtureChanges,
  };
}

export async function runIntelligenceNotificationCheck(
  entryId = getEntryId(),
): Promise<NotificationRunResult> {
  const data = await getDashboardData(entryId);
  const preferences = await loadPreferences(entryId);
  const gameweek = data.analysis.gameweek;

  const previousState = await loadNotificationState(entryId, gameweek);
  const currentState = buildNotificationState(data.analysis, data.intelligence);
  const existingKeys = await loadExistingDedupeKeys(entryId);
  const context = buildEvaluateContext(data);

  const notifications = evaluateNotifications(
    previousState,
    currentState,
    preferences,
    existingKeys,
    context,
  );

  const dispatchResults = await dispatchNotifications(
    entryId,
    notifications,
    preferences,
  );

  await saveNotificationState(entryId, gameweek, currentState);
  const pendingProcessed = await processPendingDeliveries(preferences);

  return {
    entryId,
    gameweek,
    notificationsCreated: dispatchResults.filter((r) => r.notificationId).length,
    deliveries: dispatchResults.reduce((sum, r) => sum + r.deliveries.length, 0),
    pendingProcessed,
  };
}

export async function runGameweekReportCron(
  entryId = getEntryId(),
): Promise<NotificationRunResult & { reportGenerated: boolean }> {
  const data = await getDashboardData(entryId);
  const preferences = await loadPreferences(entryId);
  const gameweek = data.analysis.gameweek;

  if (data.gameweek.isFinished) {
    return {
      entryId,
      gameweek,
      notificationsCreated: 0,
      deliveries: 0,
      pendingProcessed: 0,
      reportGenerated: false,
    };
  }

  const [bootstrap] = await Promise.all([getBootstrapStatic()]);
  const teamsById = indexById(bootstrap.teams);
  const typesById = indexById(bootstrap.element_types);
  const allPlayers = bootstrap.elements.map((element) =>
    normalizePlayer(element, teamsById, typesById),
  );

  const currentXi = currentAnalysisPlayers(
    data.analysis,
    data.startingXi.map((player) => player.id),
  );
  const currentBench = currentAnalysisPlayers(
    data.analysis,
    data.bench.map((player) => player.id),
  );
  const input = toAIReportInput(data.analysis, currentXi, currentBench, data.intelligence);
  const result = await generateGameweekReport(input, data.analysis);

  await persistGameweekReport(data, result, {
    provider: result.source === "ai" ? process.env.AI_PROVIDER ?? "openai" : "fallback",
    model: process.env.OPENAI_MODEL,
    allPlayers,
  });

  const existingKeys = await loadExistingDedupeKeys(entryId);
  const formatted = formatGameweekReportNotification(
    data.analysis,
    data.gameweek.deadline,
  );

  const notifications: Notification[] = [];
  const reportNotification = createGameweekReportNotification(
    gameweek,
    formatted.title,
    formatted.message,
    existingKeys,
  );

  if (reportNotification && preferences.gameweekReports) {
    notifications.push(reportNotification);
  }

  const dispatchResults = await dispatchNotifications(
    entryId,
    notifications,
    preferences,
  );

  const currentState = buildNotificationState(data.analysis, data.intelligence);
  await saveNotificationState(entryId, gameweek, currentState);
  const pendingProcessed = await processPendingDeliveries(preferences);

  return {
    entryId,
    gameweek,
    notificationsCreated: dispatchResults.filter((r) => r.notificationId).length,
    deliveries: dispatchResults.reduce((sum, r) => sum + r.deliveries.length, 0),
    pendingProcessed,
    reportGenerated: true,
  };
}

export async function runDeadlineCheckCron(
  entryId = getEntryId(),
): Promise<NotificationRunResult> {
  const data = await getDashboardData(entryId);
  const preferences = await loadPreferences(entryId);
  const gameweek = data.analysis.gameweek;
  const existingKeys = await loadExistingDedupeKeys(entryId);

  const keyRisk = data.analysis.playerRisks.find((risk) => risk.risk !== "LOW");
  const riskLine = keyRisk
    ? `${keyRisk.player.webName} — ${keyRisk.player.chanceOfPlaying ?? "?"}% chance of playing`
    : undefined;

  if (!data.gameweek.deadline) {
    return {
      entryId,
      gameweek,
      notificationsCreated: 0,
      deliveries: 0,
      pendingProcessed: 0,
    };
  }

  const notifications = evaluateDeadlineReminders(
    gameweek,
    data.gameweek.deadline,
    data.gameweek.isFinished,
    data.analysis.captain.player.webName,
    data.analysis.transferRecommendation.action,
    riskLine,
    preferences,
    existingKeys,
  );

  const dispatchResults = await dispatchNotifications(
    entryId,
    notifications,
    preferences,
  );

  const pendingProcessed = await processPendingDeliveries(preferences);

  return {
    entryId,
    gameweek,
    notificationsCreated: dispatchResults.filter((r) => r.notificationId).length,
    deliveries: dispatchResults.reduce((sum, r) => sum + r.deliveries.length, 0),
    pendingProcessed,
  };
}
