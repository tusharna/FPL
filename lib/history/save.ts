import { ENGINE_VERSION } from "@/lib/analysis/config";
import { formationFromPlayers } from "@/lib/ai/input";
import type { ReportResult } from "@/lib/ai/types";
import { getSupabaseAdmin, isDatabaseConfigured } from "@/lib/db/client";
import { TABLES } from "@/lib/db/schema";
import type { DashboardPayload } from "@/lib/fpl/dashboard-data";
import type { Player } from "@/lib/fpl/types";
import type { PersistReportOptions, PersistResult } from "./types";

function snapshotRows(players: Player[], gameweekId: number) {
  return players.map((player) => ({
    id: player.id,
    gameweek_id: gameweekId,
    name: player.webName,
    position: player.position,
    team_id: player.teamId,
    price: player.price,
    form: player.form,
    total_points: player.totalPoints,
    points_per_game: player.pointsPerGame,
    expected_goals: player.expectedGoals,
    expected_assists: player.expectedAssists,
    expected_goal_involvement: player.expectedGoalInvolvement,
    minutes: player.minutes,
    starts: player.starts,
    ownership: player.ownership,
    chance_of_playing: player.chanceOfPlaying,
    news: player.news || null,
  }));
}

export async function persistGameweekReport(
  data: DashboardPayload,
  reportResult: ReportResult,
  options: PersistReportOptions,
): Promise<PersistResult | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const gameweekId = data.analysis.gameweek;
  const entryId = data.entryId;

  const { data: existingRecommendation, error: existingError } = await supabase
    .from(TABLES.recommendations)
    .select("id")
    .eq("entry_id", entryId)
    .eq("gameweek_id", gameweekId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingRecommendationErrorMessage(existingError.message));
  }

  if (existingRecommendation) {
    const reportSaved = await saveReportIfMissing(
      supabase,
      existingRecommendation.id,
      reportResult,
      options,
    );
    return {
      recommendationId: existingRecommendation.id,
      gameweekId,
      created: false,
      reportSaved,
    };
  }

  const { error: managerError } = await supabase.from(TABLES.managers).upsert(
    {
      id: entryId,
      entry_id: entryId,
      name: data.manager.managerName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "entry_id" },
  );
  if (managerError) {
    throw new Error(`Failed to save manager: ${managerError.message}`);
  }

  const { error: gameweekError } = await supabase.from(TABLES.gameweeks).upsert(
    {
      id: gameweekId,
      name: data.gameweek.relevant.name,
      deadline_time: data.gameweek.deadline,
      finished: data.gameweek.isFinished,
      data_updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (gameweekError) {
    throw new Error(`Failed to save gameweek: ${gameweekError.message}`);
  }

  const { error: playersError } = await supabase
    .from(TABLES.playersSnapshot)
    .upsert(snapshotRows(options.allPlayers, gameweekId), {
      onConflict: "id,gameweek_id",
      ignoreDuplicates: true,
    });
  if (playersError) {
    throw new Error(`Failed to save player snapshots: ${playersError.message}`);
  }

  const teamRows = data.squad.map((player) => ({
    entry_id: entryId,
    gameweek_id: gameweekId,
    player_id: player.id,
    squad_position: player.squadPosition,
    is_starting: player.isStarting,
    is_captain: player.isCaptain,
    is_vice_captain: player.isViceCaptain,
    multiplier: player.multiplier,
    purchase_price: player.price,
    selling_price: player.price,
  }));

  const { error: teamError } = await supabase
    .from(TABLES.teamSnapshots)
    .upsert(teamRows, {
      onConflict: "entry_id,gameweek_id,player_id",
      ignoreDuplicates: true,
    });
  if (teamError) {
    throw new Error(`Failed to save team snapshot: ${teamError.message}`);
  }

  const transfer = data.analysis.transferRecommendation;
  const { data: recommendation, error: recommendationError } = await supabase
    .from(TABLES.recommendations)
    .insert({
      entry_id: entryId,
      gameweek_id: gameweekId,
      current_formation: formationFromPlayers(data.startingXi),
      recommended_formation: data.analysis.recommendedFormation,
      captain_player_id: data.analysis.captain.player.playerId,
      vice_captain_player_id: data.analysis.viceCaptain.player.playerId,
      transfer_action: transfer.action,
      transfer_out_player_id: transfer.playerOut?.playerId ?? null,
      transfer_in_player_id: transfer.playerIn?.playerId ?? null,
      engine_version: ENGINE_VERSION,
      generated_at: data.analysis.generatedAt,
    })
    .select("id")
    .single();

  if (recommendationError || !recommendation) {
    throw new Error(
      `Failed to save recommendation: ${recommendationError?.message ?? "unknown error"}`,
    );
  }

  const recommendationPlayers = [
    ...data.analysis.recommendedXI.map((player, index) => ({
      recommendation_id: recommendation.id,
      player_id: player.playerId,
      squad_position: index + 1,
      is_starting: true,
      bench_order: null,
      overall_score: player.overallScore,
      fixture_score: player.fixtureScore,
      expected_points: player.expectedPointsNext,
    })),
    ...data.analysis.benchOrder.map((player, index) => ({
      recommendation_id: recommendation.id,
      player_id: player.playerId,
      squad_position: null,
      is_starting: false,
      bench_order: index + 1,
      overall_score: player.overallScore,
      fixture_score: player.fixtureScore,
      expected_points: player.expectedPointsNext,
    })),
  ];

  const { error: recommendationPlayersError } = await supabase
    .from(TABLES.recommendationPlayers)
    .insert(recommendationPlayers);
  if (recommendationPlayersError) {
    throw new Error(
      `Failed to save recommendation players: ${recommendationPlayersError.message}`,
    );
  }

  const reportSaved = await saveReportIfMissing(
    supabase,
    recommendation.id,
    reportResult,
    options,
  );

  return {
    recommendationId: recommendation.id,
    gameweekId,
    created: true,
    reportSaved,
  };
}

async function saveReportIfMissing(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  recommendationId: number,
  reportResult: ReportResult,
  options: PersistReportOptions,
): Promise<boolean> {
  const { data: existingReport, error: existingReportError } = await supabase
    .from(TABLES.reports)
    .select("id")
    .eq("recommendation_id", recommendationId)
    .limit(1)
    .maybeSingle();

  if (existingReportError) {
    throw new Error(`Failed to check existing report: ${existingReportError.message}`);
  }
  if (existingReport) {
    return false;
  }

  const { error: reportError } = await supabase.from(TABLES.reports).insert({
    recommendation_id: recommendationId,
    title: reportResult.report.title,
    report_json: reportResult.report,
    provider: options.provider ?? reportResult.source,
    model: options.model ?? null,
  });

  if (reportError) {
    throw new Error(`Failed to save AI report: ${reportError.message}`);
  }

  return true;
}

function existingRecommendationErrorMessage(message: string): string {
  return `Failed to load existing recommendation: ${message}`;
}
