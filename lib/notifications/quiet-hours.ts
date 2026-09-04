import type { NotificationSeverity } from "./types";
import type { NotificationPreferences } from "./types";

export function isInQuietHours(
  preferences: NotificationPreferences,
  now = new Date(),
): boolean {
  const quiet = preferences.quietHours;
  if (!quiet?.enabled) {
    return false;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = quiet.start.split(":").map(Number);
  const [endH, endM] = quiet.end.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export function shouldDelayDelivery(
  severity: NotificationSeverity,
  preferences: NotificationPreferences,
  now = new Date(),
): boolean {
  if (severity === "URGENT") {
    return false;
  }
  return isInQuietHours(preferences, now);
}
