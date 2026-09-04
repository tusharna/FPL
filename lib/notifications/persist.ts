import { getSupabaseAdmin, isDatabaseConfigured } from "@/lib/db/client";
import { TABLES } from "@/lib/db/schema";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  preferencesFromRow,
  preferencesToRow,
} from "./preferences";
import type {
  DeliveryStatus,
  Notification,
  NotificationDeliveryRow,
  NotificationEventRow,
  NotificationPreferences,
  NotificationState,
} from "./types";

export async function loadPreferences(
  entryId: number,
): Promise<NotificationPreferences> {
  if (!isDatabaseConfigured()) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.notificationPreferences)
    .select("*")
    .eq("entry_id", entryId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load notification preferences: ${error.message}`);
  }

  if (!data) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  return preferencesFromRow(data);
}

export async function savePreferences(
  entryId: number,
  preferences: NotificationPreferences,
): Promise<NotificationPreferences> {
  if (!isDatabaseConfigured()) {
    return preferences;
  }

  const supabase = getSupabaseAdmin();
  const row = preferencesToRow(preferences, entryId);
  const { data, error } = await supabase
    .from(TABLES.notificationPreferences)
    .upsert(row, { onConflict: "entry_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to save notification preferences: ${error.message}`);
  }

  return preferencesFromRow(data);
}

export async function loadNotificationState(
  entryId: number,
  gameweekId: number,
): Promise<NotificationState | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.notificationState)
    .select("state_json")
    .eq("entry_id", entryId)
    .eq("gameweek_id", gameweekId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load notification state: ${error.message}`);
  }

  return data?.state_json as NotificationState | null;
}

export async function saveNotificationState(
  entryId: number,
  gameweekId: number,
  state: NotificationState,
): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from(TABLES.notificationState).upsert(
    {
      entry_id: entryId,
      gameweek_id: gameweekId,
      state_json: state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "entry_id,gameweek_id" },
  );

  if (error) {
    throw new Error(`Failed to save notification state: ${error.message}`);
  }
}

export async function loadExistingDedupeKeys(
  entryId: number,
  gameweekId?: number,
): Promise<Set<string>> {
  if (!isDatabaseConfigured()) {
    return new Set();
  }

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from(TABLES.notificationEvents)
    .select("dedupe_key")
    .eq("entry_id", entryId);

  if (gameweekId != null) {
    query = query.eq("gameweek_id", gameweekId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load dedupe keys: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => row.dedupe_key));
}

export async function createNotificationEvent(
  entryId: number,
  notification: Notification,
): Promise<NotificationEventRow | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.notificationEvents)
    .insert({
      entry_id: entryId,
      gameweek_id: notification.gameweek ?? null,
      type: notification.type,
      severity: notification.severity,
      title: notification.title,
      message: notification.message,
      player_id: notification.playerId ?? null,
      action_required: notification.actionRequired,
      dedupe_key: notification.dedupeKey,
      expires_at: notification.expiresAt ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return null;
    }
    throw new Error(`Failed to create notification event: ${error.message}`);
  }

  return data as NotificationEventRow;
}

export async function createDelivery(
  notificationId: number,
  channel: string,
  destination: string | null,
  status: DeliveryStatus,
): Promise<NotificationDeliveryRow | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.notificationDeliveries)
    .insert({
      notification_id: notificationId,
      channel,
      destination,
      status,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create delivery record: ${error.message}`);
  }

  return data as NotificationDeliveryRow;
}

export async function updateDelivery(
  deliveryId: number,
  update: {
    status: DeliveryStatus;
    providerMessageId?: string;
    errorMessage?: string;
  },
): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status: update.status };

  if (update.status === "SENT" || update.status === "DELIVERED") {
    patch.sent_at = now;
    if (update.status === "DELIVERED") {
      patch.delivered_at = now;
    }
  }
  if (update.status === "FAILED") {
    patch.failed_at = now;
    patch.error_message = update.errorMessage ?? null;
  }
  if (update.providerMessageId) {
    patch.provider_message_id = update.providerMessageId;
  }

  const { error } = await supabase
    .from(TABLES.notificationDeliveries)
    .update(patch)
    .eq("id", deliveryId);

  if (error) {
    throw new Error(`Failed to update delivery: ${error.message}`);
  }
}

export async function listNotifications(
  entryId: number,
  limit = 50,
): Promise<NotificationEventRow[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.notificationEvents)
    .select("*")
    .eq("entry_id", entryId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list notifications: ${error.message}`);
  }

  return (data ?? []) as NotificationEventRow[];
}

export async function markNotificationRead(
  entryId: number,
  notificationId: number,
): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return false;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from(TABLES.notificationEvents)
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("entry_id", entryId);

  if (error) {
    throw new Error(`Failed to mark notification read: ${error.message}`);
  }

  return true;
}

export async function getDeliveriesForNotification(
  notificationId: number,
): Promise<NotificationDeliveryRow[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.notificationDeliveries)
    .select("*")
    .eq("notification_id", notificationId);

  if (error) {
    throw new Error(`Failed to load deliveries: ${error.message}`);
  }

  return (data ?? []) as NotificationDeliveryRow[];
}

export async function getPendingDeliveries(): Promise<
  { delivery: NotificationDeliveryRow; notification: NotificationEventRow }[]
> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.notificationDeliveries)
    .select("*, notification_events(*)")
    .in("status", ["PENDING", "DELAYED"]);

  if (error) {
    throw new Error(`Failed to load pending deliveries: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    delivery: row as NotificationDeliveryRow,
    notification: (row as { notification_events: NotificationEventRow })
      .notification_events,
  }));
}
