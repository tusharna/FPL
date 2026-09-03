import { getSupabaseAdmin, isDatabaseConfigured } from "@/lib/db/client";
import { TABLES } from "@/lib/db/schema";
import { getLiveGameweek } from "@/lib/fpl/live";

export async function ingestActualResults(
  gameweekId: number,
): Promise<number> {
  if (!isDatabaseConfigured()) {
    return 0;
  }

  const live = await getLiveGameweek(gameweekId);
  const rows = live.elements.map((element) => ({
    gameweek_id: gameweekId,
    player_id: element.id,
    minutes: element.stats.minutes,
    goals: element.stats.goals_scored,
    assists: element.stats.assists,
    clean_sheets: element.stats.clean_sheets,
    bonus: element.stats.bonus,
    points: element.stats.total_points,
  }));

  if (rows.length === 0) {
    return 0;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from(TABLES.actualResults).upsert(rows, {
    onConflict: "gameweek_id,player_id",
    ignoreDuplicates: false,
  });

  if (error) {
    throw new Error(`Failed to ingest actual results: ${error.message}`);
  }

  return rows.length;
}
