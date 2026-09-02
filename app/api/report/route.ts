import { currentAnalysisPlayers, toAIReportInput } from "@/lib/ai/input";
import { generateGameweekReport, publicErrorMessage } from "@/lib/ai/report";
import { getDashboardData } from "@/lib/fpl/dashboard-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getDashboardData();
    const currentXi = currentAnalysisPlayers(
      data.analysis,
      data.startingXi.map((player) => player.id),
    );
    const currentBench = currentAnalysisPlayers(
      data.analysis,
      data.bench.map((player) => player.id),
    );
    const input = toAIReportInput(data.analysis, currentXi, currentBench);
    const result = await generateGameweekReport(input, data.analysis);

    return Response.json({
      gameweek: data.analysis.gameweek,
      ...result,
    });
  } catch {
    return Response.json(
      {
        error: publicErrorMessage(),
      },
      { status: 503 },
    );
  }
}
