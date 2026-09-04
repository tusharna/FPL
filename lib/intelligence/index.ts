export type {
  AvailabilitySignal,
  DataFreshness,
  DecisionImpact,
  FixtureChange,
  FixtureIntelligence,
  IntelligenceAlert,
  IntelligenceBundle,
  IntelligenceConflict,
  IntelligencePipelineInput,
  IntelligenceSource,
  NewsItem,
  PlayerIntelligence,
  PriceSignal,
  PriceSnapshot,
} from "./types";

export {
  createFreshness,
  formatFreshnessAge,
  FRESHNESS_WINDOWS_MS,
  getFreshness,
} from "./freshness";
export {
  buildAvailabilitySignal,
  buildAvailabilitySignals,
  buildPlayerIntelligence,
  intelligenceAvailabilityAdjustment,
} from "./availability";
export {
  buildFixtureIntelligence,
  detectFixtureChanges,
  resetFixtureBaseline,
  seedFixtureBaseline,
} from "./fixtures";
export {
  capturePriceSnapshots,
  detectPriceSignals,
  squadPriceSignals,
} from "./prices";
export { createNewsProvider, sanitizeNewsText } from "./news/provider";
export type { NewsProvider } from "./news/provider";
export { dedupeNewsItems, normalizeNewsItems } from "./news/normalize";
export { filterRelevantNews, scoreNewsRelevance } from "./news/relevance";
export { resolveConflicts } from "./conflicts";
export { buildKeyAlerts, calculateDecisionImpacts } from "./impact";
export { shouldRecalculate, shouldRecalculateSquad } from "./recalculate";
export { runIntelligencePipeline, resetIntelligenceCache } from "./pipeline";
export {
  loadLatestPriceSnapshots,
  loadPreviousPlayerIntelligence,
  persistIntelligenceBundle,
} from "./persist";
