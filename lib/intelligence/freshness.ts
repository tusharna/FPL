import type { DataFreshness, FreshnessStatus } from "./types";

export const FRESHNESS_WINDOWS_MS = {
  FPL: Number(process.env.INTELLIGENCE_FPL_CACHE_MS ?? 5 * 60 * 1000),
  FIXTURES: Number(process.env.INTELLIGENCE_FIXTURE_CACHE_MS ?? 10 * 60 * 1000),
  NEWS: Number(process.env.INTELLIGENCE_NEWS_CACHE_MS ?? 15 * 60 * 1000),
  PRICES: Number(process.env.INTELLIGENCE_PRICE_CACHE_MS ?? 30 * 60 * 1000),
} as const;

type CacheEntry = {
  fetchedAt: string;
  expiresAt: string;
  status: FreshnessStatus;
};

const cache = new Map<string, CacheEntry>();

export function createFreshness(
  source: string,
  fetchedAt = new Date(),
  ttlMs = FRESHNESS_WINDOWS_MS.FPL,
  status: FreshnessStatus = "FRESH",
): DataFreshness {
  const expiresAt = new Date(fetchedAt.getTime() + ttlMs);
  cache.set(source, {
    fetchedAt: fetchedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status,
  });
  return {
    source,
    fetchedAt: fetchedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status,
  };
}

export function getFreshness(source: string): DataFreshness {
  const entry = cache.get(source);
  if (!entry) {
    return {
      source,
      fetchedAt: new Date(0).toISOString(),
      status: "ERROR",
    };
  }

  const now = Date.now();
  const expiresAt = Date.parse(entry.expiresAt);
  const status: FreshnessStatus =
    entry.status === "ERROR"
      ? "ERROR"
      : now > expiresAt
        ? "STALE"
        : "FRESH";

  return {
    source,
    fetchedAt: entry.fetchedAt,
    expiresAt: entry.expiresAt,
    status,
  };
}

export function markFreshnessError(source: string): DataFreshness {
  const fetchedAt = new Date();
  cache.set(source, {
    fetchedAt: fetchedAt.toISOString(),
    expiresAt: fetchedAt.toISOString(),
    status: "ERROR",
  });
  return {
    source,
    fetchedAt: fetchedAt.toISOString(),
    status: "ERROR",
  };
}

export function formatFreshnessAge(fetchedAt: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(fetchedAt)) / 60_000));
  if (minutes < 1) {
    return "just now";
  }
  if (minutes === 1) {
    return "1 minute ago";
  }
  return `${minutes} minutes ago`;
}
