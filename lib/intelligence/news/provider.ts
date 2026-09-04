import type { NewsItem } from "../types";

export interface NewsProvider {
  getPlayerNews(playerIds: number[]): Promise<NewsItem[]>;
}

export function sanitizeNewsText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

export class FplNewsProvider implements NewsProvider {
  constructor(
    private readonly playersById: Map<
      number,
      { id: number; webName: string; news: string }
    >,
  ) {}

  async getPlayerNews(playerIds: number[]): Promise<NewsItem[]> {
    const publishedAt = new Date().toISOString();
    const items: NewsItem[] = [];

    for (const playerId of playerIds) {
      const player = this.playersById.get(playerId);
      if (!player?.news) {
        continue;
      }

      items.push({
        id: `fpl-${playerId}-${publishedAt}`,
        playerId,
        title: sanitizeNewsText(`${player.webName}: ${player.news}`),
        summary: sanitizeNewsText(player.news),
        source: "FPL",
        url: "",
        publishedAt,
        relevance: relevanceFromFplNews(player.news),
        confidence: 0.95,
      });
    }

    return items;
  }
}

export class NullNewsProvider implements NewsProvider {
  async getPlayerNews(): Promise<NewsItem[]> {
    return [];
  }
}

export function createNewsProvider(
  playersById: Map<number, { id: number; webName: string; news: string }>,
): NewsProvider {
  return new FplNewsProvider(playersById);
}

function relevanceFromFplNews(news: string): "LOW" | "MEDIUM" | "HIGH" {
  const lower = news.toLowerCase();
  if (
    lower.includes("injur") ||
    lower.includes("suspend") ||
    lower.includes("unavail")
  ) {
    return "HIGH";
  }
  if (lower.includes("doubt") || lower.includes("knock") || lower.includes("ill")) {
    return "MEDIUM";
  }
  return "LOW";
}
