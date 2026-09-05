import { requireApiAuth } from "@/lib/auth/api";
import { getAuthenticatedDashboardData } from "@/lib/fpl/dashboard-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const data = await getAuthenticatedDashboardData();
    return Response.json({
      gameweek: data.analysis.gameweek,
      intelligence: data.intelligence,
      recalculated: data.intelligence.shouldRecalculate,
      recalculationReason: data.intelligence.recalculationReason,
    });
  } catch (error) {
    console.error("Intelligence API failed:", error);
    return Response.json(
      {
        error: "Intelligence unavailable. FPL availability data is still available.",
      },
      { status: 503 },
    );
  }
}
