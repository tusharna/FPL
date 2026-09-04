import type { NewsItem } from "../types";
import { sanitizeNewsText } from "./provider";

export function normalizeNewsItems(items: NewsItem[]): NewsItem[] {
  return dedupeNewsItems(
    items.map((item) => ({
      ...item,
      title: sanitizeNewsText(item.title),
      summary: sanitizeNewsText(item.summary || item.title),
      source: sanitizeNewsText(item.source).slice(0, 80),
      url: item.url.startsWith("http") ? item.url.slice(0, 500) : "",
    })),
  );
}

export function dedupeNewsItems(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.playerId ?? "team"}:${item.title.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
