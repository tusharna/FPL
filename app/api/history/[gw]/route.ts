import { ingestActualResults, loadGameweekDetail } from "@/lib/history";
import { requireApiAuth } from "@/lib/auth/api";
import { isDatabaseConfigured } from "@/lib/db/client";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ gw: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) {
    return auth;
  }

  if (!isDatabaseConfigured()) {
    return Response.json(
      {
        error:
          "History is unavailable. Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  const { gw } = await context.params;
  const gameweekId = Number.parseInt(gw, 10);
  if (!Number.isFinite(gameweekId)) {
    return Response.json({ error: "Invalid gameweek." }, { status: 400 });
  }

  try {
    const detail = await loadGameweekDetail(gameweekId, auth.entryId);
    if (!detail) {
      return Response.json({ error: "Gameweek not found." }, { status: 404 });
    }
    return Response.json(detail);
  } catch (error) {
    console.error("Gameweek detail failed:", error);
    return Response.json({ error: "Failed to load gameweek detail." }, { status: 503 });
  }
}

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) {
    return auth;
  }

  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured." }, { status: 503 });
  }

  const { gw } = await context.params;
  const gameweekId = Number.parseInt(gw, 10);
  if (!Number.isFinite(gameweekId)) {
    return Response.json({ error: "Invalid gameweek." }, { status: 400 });
  }

  try {
    const count = await ingestActualResults(gameweekId);
    return Response.json({ gameweek: gameweekId, playersIngested: count });
  } catch (error) {
    console.error("Result ingestion failed:", error);
    return Response.json({ error: "Failed to ingest results." }, { status: 503 });
  }
}
