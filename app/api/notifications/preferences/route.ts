import { requireApiAuth } from "@/lib/auth/api";
import { isDatabaseConfigured } from "@/lib/db/client";
import { loadPreferences, savePreferences } from "@/lib/notifications/persist";
import type { NotificationPreferences } from "@/lib/notifications/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof Response) {
    return auth;
  }

  if (!isDatabaseConfigured()) {
    return Response.json({ preferences: null, configured: false });
  }

  try {
    const preferences = await loadPreferences(auth.entryId);
    return Response.json({ preferences, configured: true });
  } catch (error) {
    console.error("Failed to load preferences:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load preferences" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) {
    return auth;
  }

  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as NotificationPreferences;
    const preferences = await savePreferences(auth.entryId, body);
    return Response.json({ preferences });
  } catch (error) {
    console.error("Failed to save preferences:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to save preferences" },
      { status: 500 },
    );
  }
}
