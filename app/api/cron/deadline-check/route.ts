import { validateCronRequest, cronUnauthorizedResponse } from "@/lib/cron/auth";
import { runDeadlineCheckCron } from "@/lib/notifications/runner";
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
    const result = await runDeadlineCheckCron();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("Deadline check cron failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 },
    );
  }
}
