import { loadHistoryOverview } from "@/lib/history";
import { isDatabaseConfigured } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return Response.json(
      {
        error:
          "History is unavailable. Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  try {
    const overview = await loadHistoryOverview();
    return Response.json(overview);
  } catch (error) {
    console.error("History overview failed:", error);
    return Response.json({ error: "Failed to load history." }, { status: 503 });
  }
}
