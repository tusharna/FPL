import type { NotificationSeverity, NotificationType } from "./types";

export function severityForType(
  type: NotificationType,
  options?: { actionRequired?: boolean; isHighRisk?: boolean },
): NotificationSeverity {
  switch (type) {
    case "CAPTAIN_RISK":
    case "DEADLINE_REMINDER":
      return options?.isHighRisk || options?.actionRequired ? "URGENT" : "IMPORTANT";
    case "CAPTAIN_CHANGE":
    case "LINEUP_CHANGE":
    case "TRANSFER_CHANGE":
    case "PLAYER_AVAILABILITY":
      return options?.isHighRisk ? "URGENT" : "IMPORTANT";
    case "FIXTURE_CHANGE":
    case "DOUBLE_GAMEWEEK":
    case "BLANK_GAMEWEEK":
      return "IMPORTANT";
    case "GAMEWEEK_REPORT":
      return "INFO";
    case "PRICE_CHANGE":
      return "INFO";
    case "SYSTEM_ERROR":
      return "IMPORTANT";
    default:
      return "INFO";
  }
}
