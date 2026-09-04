import { describe, expect, it, beforeEach } from "vitest";
import {
  buildAvailabilitySignal,
  buildPlayerIntelligence,
} from "../lib/intelligence/availability";
import { resolveConflicts } from "../lib/intelligence/conflicts";
import {
  detectFixtureChanges,
  resetFixtureBaseline,
  seedFixtureBaseline,
} from "../lib/intelligence/fixtures";
import { detectPriceSignals } from "../lib/intelligence/prices";
import { dedupeNewsItems, normalizeNewsItems } from "../lib/intelligence/news/normalize";
import { filterRelevantNews, scoreNewsRelevance } from "../lib/intelligence/news/relevance";
import { calculateDecisionImpacts } from "../lib/intelligence/impact";
import { shouldRecalculate } from "../lib/intelligence/recalculate";
import { ownedPlayer } from "./helpers";
import type { FplFixture } from "../lib/fpl/types";
import type { NewsItem } from "../lib/intelligence/types";

describe("availability intelligence", () => {
  it("maps 100% chance to low risk", () => {
    const signal = buildAvailabilitySignal(
      ownedPlayer({ id: 1, position: "MID", chanceOfPlaying: 100 }),
    );
    expect(signal.risk).toBe("LOW");
  });

  it("maps 50% chance to medium risk", () => {
    const signal = buildAvailabilitySignal(
      ownedPlayer({ id: 1, position: "MID", chanceOfPlaying: 50 }),
    );
    expect(signal.risk).toBe("MEDIUM");
  });

  it("maps 25% chance to high risk", () => {
    const signal = buildAvailabilitySignal(
      ownedPlayer({ id: 1, position: "MID", chanceOfPlaying: 25 }),
    );
    expect(signal.risk).toBe("HIGH");
  });

  it("handles missing chance values", () => {
    const signal = buildAvailabilitySignal(
      ownedPlayer({ id: 1, position: "MID", chanceOfPlaying: null }),
    );
    expect(signal.risk).toBe("LOW");
  });
});

describe("news intelligence", () => {
  it("detects relevant injury news", () => {
    const item: NewsItem = {
      id: "1",
      playerId: 1,
      title: "Player ruled out with injury",
      summary: "Expected absence for two weeks",
      source: "FPL",
      url: "",
      publishedAt: new Date().toISOString(),
      relevance: "LOW",
      confidence: 0.9,
    };
    expect(scoreNewsRelevance(item)).toBe("HIGH");
    expect(filterRelevantNews([item])).toHaveLength(1);
  });

  it("ignores irrelevant news", () => {
    const item: NewsItem = {
      id: "2",
      title: "Club launches charity campaign",
      summary: "Ticket giveaway announced",
      source: "External",
      url: "",
      publishedAt: new Date().toISOString(),
      relevance: "LOW",
      confidence: 0.4,
    };
    expect(filterRelevantNews([item])).toHaveLength(0);
  });

  it("deduplicates duplicate news", () => {
    const item: NewsItem = {
      id: "3",
      playerId: 1,
      title: "Knock concern",
      summary: "Knock concern",
      source: "FPL",
      url: "",
      publishedAt: new Date().toISOString(),
      relevance: "MEDIUM",
      confidence: 0.8,
    };
    const normalized = normalizeNewsItems([item, { ...item, id: "4" }]);
    expect(dedupeNewsItems(normalized)).toHaveLength(1);
  });
});

describe("conflict resolution", () => {
  it("keeps FPL primary when sources agree", () => {
    const player = ownedPlayer({
      id: 1,
      position: "MID",
      chanceOfPlaying: 100,
      news: "",
    });
    const { conflicts } = resolveConflicts([player], []);
    expect(conflicts).toHaveLength(0);
  });

  it("marks unresolved conflicts as high uncertainty", () => {
    const player = ownedPlayer({
      id: 1,
      position: "MID",
      chanceOfPlaying: 100,
      news: "",
    });
    const externalNews: NewsItem = {
      id: "ext-1",
      playerId: 1,
      title: "Major injury doubt",
      summary: "Player injured in training",
      source: "External",
      url: "https://example.com",
      publishedAt: new Date().toISOString(),
      relevance: "HIGH",
      confidence: 0.6,
    };
    const { players, conflicts } = resolveConflicts([player], [externalNews]);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(players[0]?.uncertainty).toBe("HIGH");
  });
});

describe("fixture intelligence", () => {
  beforeEach(() => {
    resetFixtureBaseline();
  });

  it("detects kickoff time changes", () => {
    const fixture: FplFixture = {
      id: 1,
      event: 2,
      team_h: 1,
      team_a: 2,
      team_h_score: null,
      team_a_score: null,
      finished: false,
      kickoff_time: "2026-09-10T11:30:00Z",
    };
    seedFixtureBaseline([fixture]);
    const changed = detectFixtureChanges([
      { ...fixture, kickoff_time: "2026-09-10T15:00:00Z" },
    ]);
    expect(changed.some((row) => row.type === "TIME_CHANGE")).toBe(true);
  });

  it("detects double gameweeks", () => {
    const fixtures: FplFixture[] = [
      {
        id: 1,
        event: 3,
        team_h: 5,
        team_a: 6,
        team_h_score: null,
        team_a_score: null,
        finished: false,
        kickoff_time: "2026-09-10T11:30:00Z",
      },
      {
        id: 2,
        event: 3,
        team_h: 5,
        team_a: 7,
        team_h_score: null,
        team_a_score: null,
        finished: false,
        kickoff_time: "2026-09-11T11:30:00Z",
      },
    ];
    const changes = detectFixtureChanges(fixtures);
    expect(changes.some((row) => row.type === "DOUBLE")).toBe(true);
  });
});

describe("price intelligence", () => {
  it("detects rising and falling prices", () => {
    const player = ownedPlayer({ id: 1, position: "MID", price: 7.6 });
    const signals = detectPriceSignals([player], [{ playerId: 1, price: 7.5, capturedAt: "t" }]);
    expect(signals[0]?.direction).toBe("RISING");
    expect(
      detectPriceSignals(
        [ownedPlayer({ id: 1, position: "MID", price: 7.4 })],
        [{ playerId: 1, price: 7.5, capturedAt: "t" }],
      )[0]?.direction,
    ).toBe("FALLING");
  });

  it("detects stable prices", () => {
    const signals = detectPriceSignals(
      [ownedPlayer({ id: 1, position: "MID", price: 7.5 })],
      [{ playerId: 1, price: 7.5, capturedAt: "t" }],
    );
    expect(signals[0]?.direction).toBe("STABLE");
  });
});

describe("decision impact", () => {
  it("detects captain impact", () => {
    const player = buildPlayerIntelligence(
      ownedPlayer({ id: 8, position: "MID", chanceOfPlaying: 25, news: "Injury doubt" }),
      [],
      "HIGH",
    );
    const impacts = calculateDecisionImpacts({
      players: [player],
      captainId: 8,
      priceSignals: [],
      playerNames: new Map([[8, "Captain"]]),
    });
    expect(impacts[0]?.impact).toBe("HIGH");
    expect(impacts[0]?.affectedAreas).toContain("CAPTAIN");
  });

  it("ignores no-impact events", () => {
    const player = buildPlayerIntelligence(
      ownedPlayer({ id: 2, position: "DEF", chanceOfPlaying: 100 }),
    );
    const impacts = calculateDecisionImpacts({
      players: [player],
      priceSignals: [],
      playerNames: new Map([[2, "Defender"]]),
    });
    expect(impacts[0]?.impact).toBe("NONE");
  });
});

describe("recalculation detection", () => {
  it("triggers on meaningful availability change", () => {
    const previous = buildPlayerIntelligence(
      ownedPlayer({ id: 1, position: "MID", chanceOfPlaying: 100 }),
    );
    const current = buildPlayerIntelligence(
      ownedPlayer({ id: 1, position: "MID", chanceOfPlaying: 50 }),
    );
    expect(shouldRecalculate(previous, current)).toBe(true);
  });

  it("does not trigger on non-meaningful changes", () => {
    const previous = buildPlayerIntelligence(
      ownedPlayer({ id: 1, position: "MID", chanceOfPlaying: 100 }),
    );
    const current = buildPlayerIntelligence(
      ownedPlayer({ id: 1, position: "MID", chanceOfPlaying: 100 }),
    );
    expect(shouldRecalculate(previous, current)).toBe(false);
  });
});
