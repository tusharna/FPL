import type { Player } from "@/lib/fpl/types";
import type {
  IntelligenceConflict,
  IntelligenceSource,
  NewsItem,
  PlayerIntelligence,
} from "./types";
import { buildPlayerIntelligence } from "./availability";

export function resolveConflicts(
  players: Player[],
  newsItems: NewsItem[],
): { players: PlayerIntelligence[]; conflicts: IntelligenceConflict[] } {
  const conflicts: IntelligenceConflict[] = [];
  const newsByPlayer = groupNewsByPlayer(newsItems);

  const playerIntelligence = players.map((player) => {
    const externalNews = newsByPlayer.get(player.id) ?? [];
    const externalSources: IntelligenceSource[] = externalNews
      .filter((item) => item.source !== "FPL")
      .map((item) => ({
        name: item.source,
        url: item.url || undefined,
        publishedAt: item.publishedAt,
        confidence: item.confidence,
      }));

    const fplRisk = availabilityRiskFromChance(
      player.chanceOfPlaying ?? player.chanceOfPlayingThis,
      player.news,
    );
    const externalRisk = highestExternalRisk(externalNews);
    let uncertainty: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    let resolution: IntelligenceConflict["resolution"] = "FPL_PRIMARY";
    let explanation = "FPL availability is primary.";

    if (externalNews.length > 0 && externalRisk !== fplRisk) {
      const mostRecent = externalNews
        .slice()
        .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))[0];

      if (mostRecent && mostRecent.confidence >= 0.8 && externalRisk === "HIGH" && fplRisk === "LOW") {
        resolution = "MOST_RECENT";
        uncertainty = "MEDIUM";
        explanation =
          "External report suggests higher risk than current FPL availability. FPL data still takes priority.";
      } else {
        resolution = "UNRESOLVED";
        uncertainty = "HIGH";
        explanation =
          "Conflicting availability signals. Treat availability as uncertain until FPL updates.";
      }

      conflicts.push({
        playerId: player.id,
        sources: [
          { name: "FPL", confidence: 0.95, publishedAt: new Date().toISOString() },
          ...externalSources,
        ],
        resolution,
        explanation,
      });
    }

    return buildPlayerIntelligence(player, externalSources, uncertainty);
  });

  return { players: playerIntelligence, conflicts };
}

function groupNewsByPlayer(newsItems: NewsItem[]): Map<number, NewsItem[]> {
  const map = new Map<number, NewsItem[]>();
  for (const item of newsItems) {
    if (item.playerId == null) {
      continue;
    }
    const list = map.get(item.playerId) ?? [];
    list.push(item);
    map.set(item.playerId, list);
  }
  return map;
}

function availabilityRiskFromChance(
  chance: number | null | undefined,
  news: string,
): "LOW" | "MEDIUM" | "HIGH" {
  if (chance != null) {
    if (chance <= 25) return "HIGH";
    if (chance <= 50) return "MEDIUM";
    return "LOW";
  }
  const lower = news.toLowerCase();
  if (lower.includes("injur") || lower.includes("suspend") || lower.includes("unavail")) {
    return "HIGH";
  }
  if (lower.includes("doubt") || lower.includes("knock")) {
    return "MEDIUM";
  }
  return "LOW";
}

function highestExternalRisk(items: NewsItem[]): "LOW" | "MEDIUM" | "HIGH" {
  if (items.some((item) => item.relevance === "HIGH")) {
    return "HIGH";
  }
  if (items.some((item) => item.relevance === "MEDIUM")) {
    return "MEDIUM";
  }
  return "LOW";
}
