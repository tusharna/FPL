import type { NotificationPreferences, NotificationSeverity } from "./types";

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: true,
  sms: false,
  gameweekReports: true,
  deadlineReminders: true,
  captainAlerts: true,
  lineupAlerts: true,
  transferAlerts: true,
  availabilityAlerts: true,
  fixtureAlerts: true,
  priceAlerts: false,
  minimumSeverity: "IMPORTANT",
  quietHours: {
    enabled: false,
    start: "22:00",
    end: "07:00",
  },
};

const SEVERITY_RANK: Record<NotificationSeverity, number> = {
  INFO: 0,
  IMPORTANT: 1,
  URGENT: 2,
};

export function meetsMinimumSeverity(
  severity: NotificationSeverity,
  minimum: NotificationSeverity,
): boolean {
  return SEVERITY_RANK[severity] >= SEVERITY_RANK[minimum];
}

export function isTypeEnabled(
  type: string,
  preferences: NotificationPreferences,
): boolean {
  switch (type) {
    case "GAMEWEEK_REPORT":
      return preferences.gameweekReports;
    case "DEADLINE_REMINDER":
      return preferences.deadlineReminders;
    case "CAPTAIN_CHANGE":
    case "CAPTAIN_RISK":
      return preferences.captainAlerts;
    case "LINEUP_CHANGE":
      return preferences.lineupAlerts;
    case "TRANSFER_CHANGE":
      return preferences.transferAlerts;
    case "PLAYER_AVAILABILITY":
      return preferences.availabilityAlerts;
    case "FIXTURE_CHANGE":
    case "DOUBLE_GAMEWEEK":
    case "BLANK_GAMEWEEK":
      return preferences.fixtureAlerts;
    case "PRICE_CHANGE":
      return preferences.priceAlerts;
    default:
      return true;
  }
}

export function preferencesFromRow(row: {
  email_enabled: boolean;
  sms_enabled: boolean;
  gameweek_reports: boolean;
  deadline_reminders: boolean;
  captain_alerts: boolean;
  lineup_alerts: boolean;
  transfer_alerts: boolean;
  availability_alerts: boolean;
  fixture_alerts: boolean;
  price_alerts: boolean;
  minimum_severity: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  email_destination: string | null;
  sms_destination: string | null;
}): NotificationPreferences {
  return {
    email: row.email_enabled,
    sms: row.sms_enabled,
    gameweekReports: row.gameweek_reports,
    deadlineReminders: row.deadline_reminders,
    captainAlerts: row.captain_alerts,
    lineupAlerts: row.lineup_alerts,
    transferAlerts: row.transfer_alerts,
    availabilityAlerts: row.availability_alerts,
    fixtureAlerts: row.fixture_alerts,
    priceAlerts: row.price_alerts,
    minimumSeverity: row.minimum_severity as NotificationPreferences["minimumSeverity"],
    quietHours: {
      enabled: row.quiet_hours_enabled,
      start: row.quiet_hours_start ?? "22:00",
      end: row.quiet_hours_end ?? "07:00",
    },
    emailDestination: row.email_destination ?? undefined,
    smsDestination: row.sms_destination ?? undefined,
  };
}

export function preferencesToRow(
  preferences: NotificationPreferences,
  entryId: number,
) {
  return {
    entry_id: entryId,
    email_enabled: preferences.email,
    sms_enabled: preferences.sms,
    gameweek_reports: preferences.gameweekReports,
    deadline_reminders: preferences.deadlineReminders,
    captain_alerts: preferences.captainAlerts,
    lineup_alerts: preferences.lineupAlerts,
    transfer_alerts: preferences.transferAlerts,
    availability_alerts: preferences.availabilityAlerts,
    fixture_alerts: preferences.fixtureAlerts,
    price_alerts: preferences.priceAlerts,
    minimum_severity: preferences.minimumSeverity,
    quiet_hours_enabled: preferences.quietHours?.enabled ?? false,
    quiet_hours_start: preferences.quietHours?.start ?? null,
    quiet_hours_end: preferences.quietHours?.end ?? null,
    email_destination: preferences.emailDestination ?? null,
    sms_destination: preferences.smsDestination ?? null,
    updated_at: new Date().toISOString(),
  };
}
