import { validateCronRequest, cronUnauthorizedResponse } from "@/lib/cron/auth";
import {
  runDeadlineCheckCron,
  runIntelligenceNotificationCheck,
} from "@/lib/notifications/runner";
import { isDatabaseConfigured } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!validateCronRequest(request)) {
    return cronUnauthorizedResponse();
  }

  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const [intelligence, deadline] = await Promise.all([
      runIntelligenceNotificationCheck(),
      runDeadlineCheckCron(),
    ]);

    return Response.json({
      ok: true,
      intelligence,
      deadline,
    });
  } catch (error) {
    console.error("Daily notification cron failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 },
    );
  }
}
