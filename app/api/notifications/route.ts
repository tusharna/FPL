import { getEntryId } from "@/lib/fpl/client";
import { isDatabaseConfigured } from "@/lib/db/client";
import {
  listNotifications,
  markNotificationRead,
  loadPreferences,
  savePreferences,
} from "@/lib/notifications/persist";
import type { NotificationPreferences } from "@/lib/notifications/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return Response.json({ notifications: [], configured: false });
  }

  try {
    const entryId = getEntryId();
    const notifications = await listNotifications(entryId);
    return Response.json({ notifications, configured: true });
  } catch (error) {
    console.error("Failed to load notifications:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load notifications" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { id?: number };
    if (!body.id) {
      return Response.json({ error: "Notification id required." }, { status: 400 });
    }

    const entryId = getEntryId();
    await markNotificationRead(entryId, body.id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to mark notification read:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to update notification" },
      { status: 500 },
    );
  }
}
