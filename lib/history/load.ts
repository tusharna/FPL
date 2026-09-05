import { getSupabaseAdmin, isDatabaseConfigured } from "@/lib/db/client";
import {
  TABLES,
  type ActualResultRow,
  type GameweekRow,
  type PlayerSnapshotRow,
  type RecommendationPlayerRow,
  type RecommendationRow,
  type ReportRow,
  type TeamSnapshotRow,
} from "@/lib/db/schema";
import { evaluateRecommendation } from "./evaluate";
import { ingestActualResults } from "./ingest";
import { computeHistoryMetrics } from "./metrics";
import type {
  GameweekDetail,
  GameweekHistorySummary,
  HistoryOverview,
} from "./types";

function buildPlayerNames(
  playerSnapshots: PlayerSnapshotRow[],
  teamSnapshot: TeamSnapshotRow[],
): Record<number, string> {
  const names: Record<number, string> = {};
  for (const row of playerSnapshots) {
    names[row.id] = row.name;
  }
  for (const row of teamSnapshot) {
    if (!names[row.player_id]) {
      names[row.player_id] = `Player ${row.player_id}`;
    }
  }
  return names;
}

async function loadRecommendations(
  entryId: number,
): Promise<RecommendationRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.recommendations)
    .select("*")
    .eq("entry_id", entryId)
    .order("gameweek_id", { ascending: false });

  if (error) {
    throw new Error(`Failed to load recommendations: ${error.message}`);
  }

  return (data ?? []) as RecommendationRow[];
}

async function loadGameweeks(ids: number[]): Promise<GameweekRow[]> {
  if (ids.length === 0) {
    return [];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.gameweeks)
    .select("*")
    .in("id", ids)
    .order("id", { ascending: false });

  if (error) {
    throw new Error(`Failed to load gameweeks: ${error.message}`);
  }

  return (data ?? []) as GameweekRow[];
}

export async function loadHistoryOverview(
  entryId: number,
): Promise<HistoryOverview | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const recommendations = await loadRecommendations(entryId);
  const gameweekIds = recommendations.map((row) => row.gameweek_id);
  const gameweeks = await loadGameweeks(gameweekIds);
  const supabase = getSupabaseAdmin();

  const summaries: GameweekHistorySummary[] = [];
  const evaluations = [];

  for (const gameweek of gameweeks) {
    const recommendation =
      recommendations.find((row) => row.gameweek_id === gameweek.id) ?? null;

    if (gameweek.finished) {
      await ingestActualResults(gameweek.id);
    }

    const detail = recommendation
      ? await loadGameweekDetailData(entryId, gameweek.id, recommendation)
      : null;

    const evaluation = detail?.evaluation ?? null;
    if (evaluation) {
      evaluations.push(evaluation);
    }

    summaries.push({
      gameweek,
      recommendation,
      evaluation,
      hasReport: Boolean(detail?.report),
    });
  }

  return {
    entryId,
    gameweeks: summaries,
    metrics: computeHistoryMetrics(evaluations),
  };
}

export async function loadGameweekDetail(
  gameweekId: number,
  entryId: number,
): Promise<GameweekDetail | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data: gameweek, error: gameweekError } = await supabase
    .from(TABLES.gameweeks)
    .select("*")
    .eq("id", gameweekId)
    .maybeSingle();

  if (gameweekError) {
    throw new Error(`Failed to load gameweek: ${gameweekError.message}`);
  }
  if (!gameweek) {
    return null;
  }

  const { data: recommendation, error: recommendationError } = await supabase
    .from(TABLES.recommendations)
    .select("*")
    .eq("entry_id", entryId)
    .eq("gameweek_id", gameweekId)
    .maybeSingle();

  if (recommendationError) {
    throw new Error(`Failed to load recommendation: ${recommendationError.message}`);
  }

  if (gameweek.finished) {
    await ingestActualResults(gameweekId);
  }

  return loadGameweekDetailData(
    entryId,
    gameweekId,
    (recommendation as RecommendationRow | null) ?? null,
    gameweek as GameweekRow,
  );
}

async function loadGameweekDetailData(
  entryId: number,
  gameweekId: number,
  recommendation: RecommendationRow | null,
  gameweek?: GameweekRow,
): Promise<GameweekDetail | null> {
  const supabase = getSupabaseAdmin();

  const gameweekRow =
    gameweek ??
    ((
      await supabase
        .from(TABLES.gameweeks)
        .select("*")
        .eq("id", gameweekId)
        .maybeSingle()
    ).data as GameweekRow | null);

  if (!gameweekRow) {
    return null;
  }

  const [
    { data: recommendationPlayers },
    { data: teamSnapshot },
    { data: playerSnapshots },
    { data: actualResults },
    { data: report },
  ] = await Promise.all([
    recommendation
      ? supabase
          .from(TABLES.recommendationPlayers)
          .select("*")
          .eq("recommendation_id", recommendation.id)
      : Promise.resolve({ data: [] }),
    supabase
      .from(TABLES.teamSnapshots)
      .select("*")
      .eq("entry_id", entryId)
      .eq("gameweek_id", gameweekId)
      .order("squad_position", { ascending: true }),
    supabase
      .from(TABLES.playersSnapshot)
      .select("*")
      .eq("gameweek_id", gameweekId),
    supabase
      .from(TABLES.actualResults)
      .select("*")
      .eq("gameweek_id", gameweekId),
    recommendation
      ? supabase
          .from(TABLES.reports)
          .select("*")
          .eq("recommendation_id", recommendation.id)
          .order("generated_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const teamRows = (teamSnapshot ?? []) as TeamSnapshotRow[];
  const playerRows = (playerSnapshots ?? []) as PlayerSnapshotRow[];
  const playerNames = buildPlayerNames(playerRows, teamRows);
  const evaluation = evaluateRecommendation({
    gameweekId,
    recommendation,
    recommendationPlayers: (recommendationPlayers ?? []) as RecommendationPlayerRow[],
    teamSnapshot: teamRows,
    actualResults: (actualResults ?? []) as ActualResultRow[],
    playerNames,
  });

  return {
    entryId,
    gameweek: gameweekRow,
    recommendation,
    recommendationPlayers: (recommendationPlayers ?? []) as RecommendationPlayerRow[],
    teamSnapshot: teamRows,
    playerSnapshots: playerRows,
    actualResults: (actualResults ?? []) as ActualResultRow[],
    report: (report as ReportRow | null) ?? null,
    evaluation,
    playerNames,
  };
}

export async function loadStoredReport(
  gameweekId: number,
  entryId: number,
) {
  const detail = await loadGameweekDetail(gameweekId, entryId);
  if (!detail?.report) {
    return null;
  }

  return {
    gameweek: gameweekId,
    report: detail.report.report_json,
    source: detail.report.provider === "ai" ? "ai" : "fallback",
    provider: detail.report.provider,
    model: detail.report.model,
    generatedAt: detail.report.generated_at,
  } as const;
}
