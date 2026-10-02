import {
  HIT_COST_POINTS,
  MAX_BANKED_FREE_TRANSFERS,
} from "@/lib/analysis/config";
import type { FplFixture, SquadPlayer } from "./types";

export type ChipId = "wildcard" | "freehit" | "bboost" | "3xc";

export type ChipAdviceAction = "HOLD" | "PLAY";

export type ChipAdvice = {
  action: ChipAdviceAction;
  chip: ChipId | null;
  label: string;
  reasons: string[];
};

export type PlayedChip = {
  name: string;
  event: number;
};

export type HistoryGameweek = {
  event: number;
  eventTransfers: number;
};

export const CHIP_LABELS: Record<ChipId, string> = {
  wildcard: "Wildcard",
  freehit: "Free Hit",
  bboost: "Bench Boost",
  "3xc": "Triple Captain",
};

const BLANK_PLAYERS_FOR_FREE_HIT = 4;
const DOUBLE_PLAYERS_FOR_BENCH_BOOST = 6;
const MIN_BENCH_EXPECTED_POINTS = 8;
const MIN_CAPTAIN_EXPECTED_POINTS = 6;
const UNAVAILABLE_STARTERS_FOR_WILDCARD = 3;

export function normalizeChipId(name: string | null | undefined): ChipId | null {
  if (!name) {
    return null;
  }

  const key = name.toLowerCase().replace(/[\s_-]+/g, "");
  if (key === "wildcard" || key === "wc") {
    return "wildcard";
  }
  if (key === "freehit" || key === "fh") {
    return "freehit";
  }
  if (key === "bboost" || key === "benchboost" || key === "bb") {
    return "bboost";
  }
  if (key === "3xc" || key === "triplecaptain" || key === "tc") {
    return "3xc";
  }

  return null;
}

export function formatChipLabel(name: string | null | undefined): string {
  const id = normalizeChipId(name);
  if (id) {
    return CHIP_LABELS[id];
  }
  return name?.trim() || "None";
}

export function computeFreeTransfers(input: {
  gameweeks: HistoryGameweek[];
  chips: PlayedChip[];
  maxBanked?: number;
}): number {
  const maxBanked = input.maxBanked ?? MAX_BANKED_FREE_TRANSFERS;
  const chipsByEvent = new Map<number, ChipId[]>();

  for (const chip of input.chips) {
    const id = normalizeChipId(chip.name);
    if (!id) {
      continue;
    }
    const list = chipsByEvent.get(chip.event) ?? [];
    list.push(id);
    chipsByEvent.set(chip.event, list);
  }

  let available = 1;
  const gameweeks = [...input.gameweeks].sort((left, right) => left.event - right.event);

  for (const gameweek of gameweeks) {
    const chips = chipsByEvent.get(gameweek.event) ?? [];
    if (chips.some((chip) => chip === "wildcard" || chip === "freehit")) {
      available = 1;
      continue;
    }

    const spent = Math.min(Math.max(gameweek.eventTransfers, 0), available);
    available = Math.min(maxBanked, available - spent + 1);
  }

  return available;
}

export function countTeamFixtures(
  teamId: number,
  eventId: number,
  fixtures: FplFixture[],
): number {
  return fixtures.filter(
    (fixture) =>
      fixture.event === eventId &&
      (fixture.team_h === teamId || fixture.team_a === teamId),
  ).length;
}

export function recommendChip(input: {
  available: ChipId[];
  blankPlayers: number;
  doublePlayers: number;
  captainDoubles: boolean;
  unavailableStarters: number;
  benchExpectedPoints: number;
  captainExpectedPoints: number;
}): ChipAdvice {
  const available = new Set(input.available);

  if (available.has("freehit") && input.blankPlayers >= BLANK_PLAYERS_FOR_FREE_HIT) {
    return {
      action: "PLAY",
      chip: "freehit",
      label: CHIP_LABELS.freehit,
      reasons: [
        `${input.blankPlayers} squad players have no fixture in the planning gameweek.`,
        "Free Hit replaces the squad for one week without using free transfers.",
        "This is a recommendation only — the engine never plays the chip.",
      ],
    };
  }

  if (
    available.has("bboost") &&
    input.doublePlayers >= DOUBLE_PLAYERS_FOR_BENCH_BOOST &&
    input.benchExpectedPoints >= MIN_BENCH_EXPECTED_POINTS
  ) {
    return {
      action: "PLAY",
      chip: "bboost",
      label: CHIP_LABELS.bboost,
      reasons: [
        `${input.doublePlayers} squad players have a double gameweek.`,
        `Bench expected points are ${input.benchExpectedPoints.toFixed(1)}.`,
        "Bench Boost scores the bench as well as the starting XI.",
        "This is a recommendation only — the engine never plays the chip.",
      ],
    };
  }

  if (
    available.has("3xc") &&
    input.captainDoubles &&
    input.captainExpectedPoints >= MIN_CAPTAIN_EXPECTED_POINTS
  ) {
    return {
      action: "PLAY",
      chip: "3xc",
      label: CHIP_LABELS["3xc"],
      reasons: [
        "The recommended captain has a double gameweek.",
        `Captain expected points are ${input.captainExpectedPoints.toFixed(1)}.`,
        `Triple Captain scores that player three times. A miss still costs the extra multiplier.`,
        "This is a recommendation only — the engine never plays the chip.",
      ],
    };
  }

  if (
    available.has("wildcard") &&
    input.unavailableStarters >= UNAVAILABLE_STARTERS_FOR_WILDCARD
  ) {
    return {
      action: "PLAY",
      chip: "wildcard",
      label: CHIP_LABELS.wildcard,
      reasons: [
        `${input.unavailableStarters} current starters look unavailable.`,
        "Wildcard allows unlimited free transfers for the gameweek.",
        `A normal extra transfer would cost ${HIT_COST_POINTS} points.`,
        "This is a recommendation only — the engine never plays the chip.",
      ],
    };
  }

  return {
    action: "HOLD",
    chip: null,
    label: "Hold chips",
    reasons: [
      available.size === 0
        ? "No chips are currently available."
        : "No blank, double, or availability pattern is strong enough to spend a chip.",
      "Save Wildcard, Free Hit, Bench Boost, and Triple Captain for a clearer week.",
    ],
  };
}

export function buildChipAdvice(input: {
  available: ChipId[];
  squad: SquadPlayer[];
  startingXi: SquadPlayer[];
  bench: SquadPlayer[];
  captainId: number | null;
  eventId: number;
  fixtures: FplFixture[];
}): ChipAdvice {
  const eventHasFixtures = input.fixtures.some(
    (fixture) => fixture.event === input.eventId,
  );
  const counts = input.squad.map((player) =>
    countTeamFixtures(player.teamId, input.eventId, input.fixtures),
  );
  const blankPlayers = eventHasFixtures
    ? counts.filter((count) => count === 0).length
    : 0;
  const doublePlayers = counts.filter((count) => count >= 2).length;
  const captain = input.squad.find((player) => player.id === input.captainId) ?? null;
  const captainDoubles = captain
    ? countTeamFixtures(captain.teamId, input.eventId, input.fixtures) >= 2
    : false;
  const unavailableStarters = input.startingXi.filter(
    (player) => player.chanceOfPlaying != null && player.chanceOfPlaying < 50,
  ).length;
  const benchExpectedPoints = input.bench.reduce(
    (sum, player) => sum + player.expectedPointsNext,
    0,
  );

  return recommendChip({
    available: input.available,
    blankPlayers,
    doublePlayers,
    captainDoubles,
    unavailableStarters,
    benchExpectedPoints,
    captainExpectedPoints: captain?.expectedPointsNext ?? 0,
  });
}
