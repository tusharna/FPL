import { createFreshness, FRESHNESS_WINDOWS_MS, markFreshnessError } from "./freshness";
import { buildAvailabilitySignals } from "./availability";
import { detectFixtureChanges, buildFixtureIntelligence, seedFixtureBaseline } from "./fixtures";
import { capturePriceSnapshots, detectPriceSignals, squadPriceSignals } from "./prices";
import { createNewsProvider } from "./news/provider";
import { normalizeNewsItems } from "./news/normalize";
import { filterRelevantNews } from "./news/relevance";
import { resolveConflicts } from "./conflicts";
import { buildKeyAlerts, calculateDecisionImpacts } from "./impact";
import { shouldRecalculateSquad } from "./recalculate";
import {
  loadLatestPriceSnapshots,
  loadPreviousPlayerIntelligence,
  persistIntelligenceBundle,
} from "./persist";
import type { IntelligenceBundle, IntelligencePipelineInput } from "./types";

let previousPlayerCache: import("./types").PlayerIntelligence[] = [];

export async function runIntelligencePipeline(
  input: IntelligencePipelineInput,
): Promise<IntelligenceBundle> {
  const fetchedAt = new Date().toISOString();
  const errors: string[] = [];
  const freshness = [
    createFreshness("FPL data", new Date(), FRESHNESS_WINDOWS_MS.FPL),
    createFreshness("Fixtures", new Date(), FRESHNESS_WINDOWS_MS.FIXTURES),
    createFreshness("News", new Date(), FRESHNESS_WINDOWS_MS.NEWS),
    createFreshness("Prices", new Date(), FRESHNESS_WINDOWS_MS.PRICES),
  ];

  const squadIds = input.squad.map((player) => player.id);
  const playerNames = new Map(input.squad.map((player) => [player.id, player.webName]));

  let fixtureChanges: import("./types").FixtureChange[] = [];
  try {
    seedFixtureBaseline(input.fixtures);
    fixtureChanges = detectFixtureChanges(input.fixtures);
  } catch {
    errors.push("Fixture intelligence unavailable. Using latest FPL fixture data.");
    freshness[1] = markFreshnessError("Fixtures");
  }

  let priceSignals: import("./types").PriceSignal[] = [];
  try {
    const previousSnapshots = await loadLatestPriceSnapshots(squadIds);
    priceSignals = squadPriceSignals(
      input.squad,
      detectPriceSignals(input.allPlayers, previousSnapshots),
    );
  } catch {
    errors.push("Price intelligence unavailable. Using latest FPL prices.");
    freshness[3] = markFreshnessError("Prices");
  }

  let news: import("./types").NewsItem[] = [];
  try {
    const playersById = new Map(
      input.allPlayers.map((player) => [
        player.id,
        { id: player.id, webName: player.webName, news: player.news },
      ]),
    );
    const provider = createNewsProvider(playersById);
    const rawNews = await provider.getPlayerNews(squadIds);
    news = filterRelevantNews(normalizeNewsItems(rawNews));
  } catch {
    errors.push("External news unavailable. FPL availability data is still available.");
    freshness[2] = markFreshnessError("News");
  }

  const { players, conflicts } = resolveConflicts(input.squad, news);
  const availability = buildAvailabilitySignals(input.squad);
  const fixtureIntelligence = input.squad.map((player) =>
    buildFixtureIntelligence({
      playerId: player.id,
      teamId: player.teamId,
      fixtures: input.fixtures,
      teamsById: input.teamsById,
      fromGameweek: input.gameweekId,
      fixtureChanges,
    }),
  );

  const impacts = calculateDecisionImpacts({
    players,
    captainId: input.captainId,
    viceCaptainId: input.viceCaptainId,
    transferPlayerIds: input.transferPlayerIds,
    recommendedXiIds: input.recommendedXiIds,
    priceSignals,
    playerNames,
  });

  const previousPlayers =
    input.previousPlayers ??
    (await loadPreviousPlayerIntelligence(squadIds, input.gameweekId)) ??
    previousPlayerCache;

  const recalculation = shouldRecalculateSquad(previousPlayers, players);
  const keyAlerts = buildKeyAlerts(impacts, playerNames);

  const bundle: IntelligenceBundle = {
    gameweekId: input.gameweekId,
    fetchedAt,
    freshness,
    availability,
    players,
    fixtureChanges,
    fixtureIntelligence,
    priceSignals,
    news,
    conflicts,
    impacts,
    keyAlerts,
    shouldRecalculate: recalculation.shouldRecalculate,
    recalculationReason: recalculation.reason,
    errors,
  };

  previousPlayerCache = players;
  capturePriceSnapshots(input.squad);

  try {
    await persistIntelligenceBundle(bundle);
  } catch {
    errors.push("Intelligence persistence unavailable. Live analysis still works.");
  }

  return bundle;
}

export function resetIntelligenceCache(): void {
  previousPlayerCache = [];
}
