import type { NewsItem } from "../types";

const RELEVANT_KEYWORDS = [
  "injury",
  "injured",
  "suspension",
  "suspended",
  "doubt",
  "knock",
  "illness",
  "absent",
  "absence",
  "return",
  "rotation",
  "starting",
  "bench",
  "manager",
  "training",
  "postpon",
  "blank",
  "double",
  "international",
  "unavailable",
];

const IRRELEVANT_KEYWORDS = [
  "contract",
  "award",
  "celebration",
  "charity",
  "documentary",
  "ticket",
  "merchandise",
];

export function scoreNewsRelevance(item: NewsItem): "LOW" | "MEDIUM" | "HIGH" {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  if (IRRELEVANT_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return "LOW";
  }
  const hits = RELEVANT_KEYWORDS.filter((keyword) => text.includes(keyword));
  if (hits.length >= 2) {
    return "HIGH";
  }
  if (hits.length === 1) {
    return "MEDIUM";
  }
  return "LOW";
}

export function filterRelevantNews(items: NewsItem[]): NewsItem[] {
  return items
    .map((item) => ({
      ...item,
      relevance: scoreNewsRelevance(item),
    }))
    .filter((item) => item.relevance !== "LOW");
}
