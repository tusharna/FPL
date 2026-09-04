import { getDashboardData } from "@/lib/fpl/dashboard-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getDashboardData();
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
