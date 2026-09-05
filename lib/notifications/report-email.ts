import type { ReportResult } from "@/lib/ai/types";
import type { DashboardPayload } from "@/lib/fpl/dashboard-data";
import { resolveEmailDestination } from "@/lib/providers/email";
import { buildDedupeKey } from "./dedupe";
import { dispatchNotification } from "./dispatcher";
import { formatManualReportEmailMessage } from "./formatter";
import { loadPreferences } from "./persist";
import { severityForType } from "./severity";
import type { Notification } from "./types";

export type ManualReportEmailResult = {
  sent: boolean;
  skipped?: string;
  notificationId?: number | null;
};

export async function sendManualReportEmail(
  entryId: number,
  data: DashboardPayload,
  reportResult: ReportResult,
): Promise<ManualReportEmailResult> {
  const preferences = await loadPreferences(entryId);

  if (!preferences.email) {
    return { sent: false, skipped: "Email notifications are disabled." };
  }

  if (!preferences.gameweekReports) {
    return { sent: false, skipped: "Gameweek report emails are disabled." };
  }

  const destination = resolveEmailDestination(preferences.emailDestination);
  if (!destination) {
    return { sent: false, skipped: "No email destination configured." };
  }

  const gameweek = data.analysis.gameweek;
  const formatted = formatManualReportEmailMessage(
    data.analysis,
    reportResult.report.executiveSummary,
    reportResult.report.finalVerdict,
    data.gameweek.deadline,
  );

  const notification: Notification = {
    type: "GAMEWEEK_REPORT",
    severity: severityForType("GAMEWEEK_REPORT"),
    title: formatted.title,
    message: formatted.message,
    gameweek,
    actionRequired: false,
    dedupeKey: buildDedupeKey(gameweek, "GAMEWEEK_REPORT", [
      "manual",
      Date.now(),
    ]),
  };

  try {
    const result = await dispatchNotification(entryId, notification, preferences);
    const emailDelivery = result.deliveries.find((d) => d.channel === "EMAIL");

    if (emailDelivery?.status === "SENT") {
      return { sent: true, notificationId: result.notificationId };
    }

    if (emailDelivery?.status === "DELAYED") {
      return {
        sent: false,
        skipped: "Email delayed due to quiet hours.",
        notificationId: result.notificationId,
      };
    }

    return {
      sent: false,
      skipped: emailDelivery?.error ?? "Email delivery failed.",
      notificationId: result.notificationId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email delivery failed.";
    console.error("Manual report email failed:", error);
    return { sent: false, skipped: message };
  }
}
