import type { NotificationChannel, Notification, NotificationPreferences } from "./types";

export function selectChannels(
  notification: Notification,
  preferences: NotificationPreferences,
): NotificationChannel[] {
  const channels: NotificationChannel[] = [];

  if (preferences.email) {
    channels.push("EMAIL");
  }

  if (
    preferences.sms &&
    (notification.severity === "URGENT" || notification.type === "DEADLINE_REMINDER")
  ) {
    channels.push("SMS");
  }

  return channels;
}

export function formatEmailSubject(notification: Notification): string {
  const prefix =
    notification.severity === "URGENT"
      ? "🚨 "
      : notification.severity === "IMPORTANT"
        ? "⚠️ "
        : "";
  return `${prefix}${notification.title}`;
}

export function formatSmsMessage(notification: Notification): string {
  const firstLine = notification.message.split("\n").find((line) => line.trim()) ?? notification.title;
  const summary = firstLine.length > 140 ? `${firstLine.slice(0, 137)}...` : firstLine;
  return `${notification.title}: ${summary}`;
}
