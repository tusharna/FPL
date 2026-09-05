import { currentAnalysisPlayers, toAIReportInput } from "@/lib/ai/input";
import { generateGameweekReport, publicErrorMessage } from "@/lib/ai/report";
import { requireApiAuth } from "@/lib/auth/api";
import { getBootstrapStatic } from "@/lib/fpl/bootstrap";
import { getAuthenticatedDashboardData } from "@/lib/fpl/dashboard-data";
import { indexById, normalizePlayer } from "@/lib/fpl/normalize";
import {
  loadStoredReport,
  persistGameweekReport,
} from "@/lib/history";
import { isDatabaseConfigured } from "@/lib/db/client";
import { sendManualReportEmail } from "@/lib/notifications/report-email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const url = new URL(request.url);
    const storedOnly = url.searchParams.get("stored") === "true";

    if (storedOnly && isDatabaseConfigured()) {
      const data = await getAuthenticatedDashboardData();
      const stored = await loadStoredReport(data.analysis.gameweek, auth.entryId);
      if (stored) {
        return Response.json(stored);
      }
      return Response.json({ error: "No stored report for this gameweek." }, { status: 404 });
    }

    const [data, bootstrap] = await Promise.all([
      getAuthenticatedDashboardData(),
      getBootstrapStatic(),
    ]);

    const teamsById = indexById(bootstrap.teams);
    const typesById = indexById(bootstrap.element_types);
    const allPlayers = bootstrap.elements.map((element) =>
      normalizePlayer(element, teamsById, typesById),
    );

    const currentXi = currentAnalysisPlayers(
      data.analysis,
      data.startingXi.map((player) => player.id),
    );
    const currentBench = currentAnalysisPlayers(
      data.analysis,
      data.bench.map((player) => player.id),
    );
    const input = toAIReportInput(
      data.analysis,
      currentXi,
      currentBench,
      data.intelligence,
    );
    const result = await generateGameweekReport(input, data.analysis);

    const persisted = await persistGameweekReport(data, result, {
      provider: result.source === "ai" ? process.env.AI_PROVIDER ?? "openai" : "fallback",
      model: process.env.OPENAI_MODEL,
      allPlayers,
    });

    const email = await sendManualReportEmail(auth.entryId, data, result);

    return Response.json({
      gameweek: data.analysis.gameweek,
      ...result,
      persisted,
      email,
    });
  } catch (error) {
    console.error("Report generation failed:", error);
    return Response.json(
      {
        error: publicErrorMessage(),
      },
      { status: 503 },
    );
  }
}
