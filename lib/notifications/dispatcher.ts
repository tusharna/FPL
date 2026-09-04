import { formatEmailSubject, formatSmsMessage, selectChannels } from "./channels";
import { shouldDelayDelivery } from "./quiet-hours";
import {
  createDelivery,
  createNotificationEvent,
  updateDelivery,
} from "./persist";
import type { Notification, NotificationPreferences } from "./types";
import {
  createEmailProvider,
  resolveEmailDestination,
} from "@/lib/providers/email";
import {
  createSMSProvider,
  resolveSmsDestination,
} from "@/lib/providers/sms";

export type DispatchResult = {
  notificationId: number | null;
  deliveries: {
    channel: string;
    status: string;
    error?: string;
  }[];
  skipped: boolean;
};

export async function dispatchNotification(
  entryId: number,
  notification: Notification,
  preferences: NotificationPreferences,
): Promise<DispatchResult> {
  const event = await createNotificationEvent(entryId, notification);

  if (!event) {
    return { notificationId: null, deliveries: [], skipped: true };
  }

  const channels = selectChannels(notification, preferences);
  const deliveries: DispatchResult["deliveries"] = [];

  if (channels.length === 0) {
    return { notificationId: event.id, deliveries, skipped: false };
  }

  const delay = shouldDelayDelivery(notification.severity, preferences);

  for (const channel of channels) {
    const destination =
      channel === "EMAIL"
        ? resolveEmailDestination(preferences.emailDestination)
        : resolveSmsDestination(preferences.smsDestination);

    const delivery = await createDelivery(
      event.id,
      channel,
      destination,
      delay ? "DELAYED" : "PENDING",
    );

    if (!delivery) {
      continue;
    }

    if (delay) {
      deliveries.push({ channel, status: "DELAYED" });
      continue;
    }

    if (!destination) {
      await updateDelivery(delivery.id, {
        status: "FAILED",
        errorMessage: `No ${channel} destination configured.`,
      });
      deliveries.push({
        channel,
        status: "FAILED",
        error: `No ${channel} destination configured.`,
      });
      continue;
    }

    try {
      if (channel === "EMAIL") {
        const emailProvider = createEmailProvider();
        const result = await emailProvider.sendEmail({
          to: destination,
          subject: formatEmailSubject(notification),
          text: notification.message,
        });
        await updateDelivery(delivery.id, {
          status: "SENT",
          providerMessageId: result.providerMessageId,
        });
        deliveries.push({ channel, status: "SENT" });
      } else {
        const smsProvider = createSMSProvider();
        const result = await smsProvider.sendSMS({
          to: destination,
          message: formatSmsMessage(notification),
        });
        await updateDelivery(delivery.id, {
          status: "SENT",
          providerMessageId: result.providerMessageId,
        });
        deliveries.push({ channel, status: "SENT" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delivery failed";
      await updateDelivery(delivery.id, {
        status: "FAILED",
        errorMessage: message,
      });
      deliveries.push({ channel, status: "FAILED", error: message });
    }
  }

  return { notificationId: event.id, deliveries, skipped: false };
}

export async function dispatchNotifications(
  entryId: number,
  notifications: Notification[],
  preferences: NotificationPreferences,
): Promise<DispatchResult[]> {
  const results: DispatchResult[] = [];
  for (const notification of notifications) {
    results.push(await dispatchNotification(entryId, notification, preferences));
  }
  return results;
}

export async function processPendingDeliveries(
  preferences: NotificationPreferences,
): Promise<number> {
  const { getPendingDeliveries } = await import("./persist");
  const pending = await getPendingDeliveries();
  let processed = 0;

  for (const { delivery, notification } of pending) {
    if (delivery.status === "DELAYED") {
      const notifSeverity = notification.severity as Notification["severity"];
      if (shouldDelayDelivery(notifSeverity, preferences)) {
        continue;
      }
    }

    if (!delivery.destination) {
      await updateDelivery(delivery.id, {
        status: "FAILED",
        errorMessage: "No destination configured.",
      });
      continue;
    }

    try {
      if (delivery.channel === "EMAIL") {
        const emailProvider = createEmailProvider();
        const result = await emailProvider.sendEmail({
          to: delivery.destination,
          subject: formatEmailSubject({
            type: notification.type as Notification["type"],
            severity: notification.severity as Notification["severity"],
            title: notification.title,
            message: notification.message,
            actionRequired: notification.action_required,
            dedupeKey: notification.dedupe_key,
          }),
          text: notification.message,
        });
        await updateDelivery(delivery.id, {
          status: "SENT",
          providerMessageId: result.providerMessageId,
        });
      } else if (delivery.channel === "SMS") {
        const smsProvider = createSMSProvider();
        const result = await smsProvider.sendSMS({
          to: delivery.destination,
          message: formatSmsMessage({
            type: notification.type as Notification["type"],
            severity: notification.severity as Notification["severity"],
            title: notification.title,
            message: notification.message,
            actionRequired: notification.action_required,
            dedupeKey: notification.dedupe_key,
          }),
        });
        await updateDelivery(delivery.id, {
          status: "SENT",
          providerMessageId: result.providerMessageId,
        });
      }
      processed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delivery failed";
      await updateDelivery(delivery.id, {
        status: "FAILED",
        errorMessage: message,
      });
    }
  }

  return processed;
}
