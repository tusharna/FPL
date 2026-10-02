import { describe, expect, it } from "vitest";
import {
  buildChipAdvice,
  computeFreeTransfers,
  formatChipLabel,
  normalizeChipId,
  recommendChip,
} from "@/lib/fpl/chips";
import type { FplFixture, SquadPlayer } from "@/lib/fpl/types";

describe("chip ids", () => {
  it("normalizes official FPL chip names", () => {
    expect(normalizeChipId("bboost")).toBe("bboost");
    expect(normalizeChipId("Free Hit")).toBe("freehit");
    expect(normalizeChipId("3xc")).toBe("3xc");
    expect(formatChipLabel("wildcard")).toBe("Wildcard");
    expect(normalizeChipId("mystery")).toBeNull();
  });
});

describe("computeFreeTransfers", () => {
  it("starts the season with one free transfer", () => {
    expect(computeFreeTransfers({ gameweeks: [], chips: [] })).toBe(1);
  });

  it("banks an unused transfer up to the maximum", () => {
    expect(
      computeFreeTransfers({
        gameweeks: [
          { event: 1, eventTransfers: 0 },
          { event: 2, eventTransfers: 0 },
        ],
        chips: [],
      }),
    ).toBe(3);
  });

  it("does not bank transfers through a wildcard", () => {
    expect(
      computeFreeTransfers({
        gameweeks: [
          { event: 1, eventTransfers: 0 },
          { event: 2, eventTransfers: 8 },
        ],
        chips: [{ name: "wildcard", event: 2 }],
      }),
    ).toBe(1);
  });

  it("returns one free transfer after spending the only one", () => {
    expect(
      computeFreeTransfers({
        gameweeks: [{ event: 1, eventTransfers: 1 }],
        chips: [],
      }),
    ).toBe(1);
  });
});

describe("recommendChip", () => {
  it("holds when no chip pattern is strong", () => {
    const advice = recommendChip({
      available: ["wildcard", "freehit", "bboost", "3xc"],
      blankPlayers: 1,
      doublePlayers: 1,
      captainDoubles: false,
      unavailableStarters: 0,
      benchExpectedPoints: 4,
      captainExpectedPoints: 5,
    });
    expect(advice.action).toBe("HOLD");
  });

  it("plays Free Hit when enough players blank", () => {
    const advice = recommendChip({
      available: ["freehit", "wildcard"],
      blankPlayers: 5,
      doublePlayers: 0,
      captainDoubles: false,
      unavailableStarters: 0,
      benchExpectedPoints: 2,
      captainExpectedPoints: 3,
    });
    expect(advice.chip).toBe("freehit");
  });

  it("plays Wildcard when several starters are unavailable", () => {
    const advice = recommendChip({
      available: ["wildcard"],
      blankPlayers: 0,
      doublePlayers: 0,
      captainDoubles: false,
      unavailableStarters: 3,
      benchExpectedPoints: 2,
      captainExpectedPoints: 4,
    });
    expect(advice.chip).toBe("wildcard");
  });
});

describe("buildChipAdvice", () => {
  it("does not treat a missing fixture list as a blank gameweek", () => {
    const player = {
      id: 1,
      teamId: 1,
      chanceOfPlaying: 100,
      expectedPointsNext: 4,
    } as SquadPlayer;

    const advice = buildChipAdvice({
      available: ["freehit"],
      squad: [player],
      startingXi: [player],
      bench: [],
      captainId: 1,
      eventId: 10,
      fixtures: [] as FplFixture[],
    });

    expect(advice.action).toBe("HOLD");
  });
});
