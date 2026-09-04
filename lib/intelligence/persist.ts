import { getSupabaseAdmin, isDatabaseConfigured } from "@/lib/db/client";
import { TABLES } from "@/lib/db/schema";
import type {
  FixtureChange,
  IntelligenceBundle,
  NewsItem,
  PriceSnapshot,
} from "./types";

export async function loadLatestPriceSnapshots(
  playerIds: number[],
): Promise<PriceSnapshot[]> {
  if (!isDatabaseConfigured() || playerIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.priceSnapshots)
    .select("player_id, price, captured_at")
    .in("player_id", playerIds)
    .order("captured_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const latest = new Map<number, PriceSnapshot>();
  for (const row of data) {
    if (!latest.has(row.player_id)) {
      latest.set(row.player_id, {
        playerId: row.player_id,
        price: Number(row.price),
        capturedAt: row.captured_at,
      });
    }
  }

  return [...latest.values()];
}

export async function persistIntelligenceBundle(
  bundle: IntelligenceBundle,
): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  const supabase = getSupabaseAdmin();

  if (bundle.priceSignals.length > 0) {
    const rows = bundle.priceSignals.map((signal) => ({
      player_id: signal.playerId,
      price: signal.currentPrice,
    }));
    await supabase.from(TABLES.priceSnapshots).insert(rows);
  }

  if (bundle.fixtureChanges.length > 0) {
    const rows = bundle.fixtureChanges.map((change) => ({
      fixture_id: change.fixtureId,
      type: change.type,
      previous_value: change.previousValue ?? null,
      new_value: change.newValue ?? null,
      detected_at: change.detectedAt,
    }));
    await supabase.from(TABLES.fixtureChanges).upsert(rows, {
      onConflict: "fixture_id,type,new_value",
      ignoreDuplicates: true,
    });
  }

  if (bundle.news.length > 0) {
    const rows = bundle.news.map((item) => newsRow(item));
    await supabase.from(TABLES.newsItems).upsert(rows, { onConflict: "id" });
  }

  const eventRows = bundle.keyAlerts.map((alert) => ({
    gameweek_id: bundle.gameweekId,
    player_id: alert.playerId,
    type: alert.type,
    risk: alert.severity,
    confidence: alert.severity === "HIGH" ? 0.9 : alert.severity === "MEDIUM" ? 0.7 : 0.5,
    reason: alert.explanation,
    source: "intelligence",
    detected_at: bundle.fetchedAt,
  }));

  if (eventRows.length > 0) {
    await supabase.from(TABLES.intelligenceEvents).insert(eventRows);
  }
}

function newsRow(item: NewsItem) {
  return {
    id: item.id,
    player_id: item.playerId ?? null,
    title: item.title,
    summary: item.summary,
    source: item.source,
    source_url: item.url || null,
    published_at: item.publishedAt,
    relevance: item.relevance,
    confidence: item.confidence,
  };
}

export async function loadPreviousPlayerIntelligence(
  playerIds: number[],
  gameweekId: number,
): Promise<import("./types").PlayerIntelligence[]> {
  if (!isDatabaseConfigured() || playerIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from(TABLES.intelligenceEvents)
    .select("*")
    .eq("gameweek_id", gameweekId)
    .in("player_id", playerIds)
    .order("detected_at", { ascending: false });

  if (!data) {
    return [];
  }

  const latest = new Map<number, import("./types").PlayerIntelligence>();
  for (const row of data) {
    if (latest.has(row.player_id)) {
      continue;
    }
    latest.set(row.player_id, {
      playerId: row.player_id,
      availability: {
        risk: (row.risk as "LOW" | "MEDIUM" | "HIGH") ?? "LOW",
        reason: row.reason ?? undefined,
        confidence: Number(row.confidence ?? 0.5),
      },
      minutesRisk: "LOW",
      sources: [{ name: row.source ?? "intelligence", confidence: Number(row.confidence ?? 0.5) }],
      uncertainty: (row.risk as "LOW" | "MEDIUM" | "HIGH") ?? "LOW",
    });
  }

  return [...latest.values()];
}
