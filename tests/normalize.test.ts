import { describe, expect, it } from "vitest";
import {
  classifySquad,
  isBench,
  isStartingXi,
  mapPicksToSquad,
  normalizePlayer,
} from "../lib/fpl/normalize";
import type { FplElement, FplElementType, FplPick, FplTeam } from "../lib/fpl/types";

const teams: FplTeam[] = [
  { id: 14, name: "Manchester United", short_name: "MUN" },
];

const types: FplElementType[] = [
  { id: 3, singular_name: "Midfielder", singular_name_short: "MID", element_count: 1 },
];

const bruno: FplElement = {
  id: 426,
  first_name: "Bruno",
  second_name: "Fernandes",
  web_name: "Fernandes",
  team: 14,
  element_type: 3,
  now_cost: 90,
  form: "6.5",
  total_points: 40,
  points_per_game: "6.7",
  event_points: 8,
  ep_next: "5.2",
  ep_this: "4.8",
  expected_goals: "1.20",
  expected_assists: "2.10",
  expected_goal_involvements: "3.30",
  minutes: 270,
  starts: 3,
  selected_by_percent: "18.4",
  chance_of_playing_this_round: 100,
  chance_of_playing_next_round: 100,
  news: "",
};

function pick(
  overrides: Partial<FplPick> & Pick<FplPick, "element" | "position" | "multiplier">,
): FplPick {
  return {
    is_captain: false,
    is_vice_captain: false,
    ...overrides,
  };
}

describe("player mapping", () => {
  it("maps element 426 to Bruno Fernandes", () => {
    const player = normalizePlayer(
      bruno,
      new Map(teams.map((team) => [team.id, team])),
      new Map(types.map((type) => [type.id, type])),
    );

    expect(player.id).toBe(426);
    expect(player.name).toBe("Bruno Fernandes");
    expect(player.webName).toBe("Fernandes");
    expect(player.position).toBe("MID");
    expect(player.teamShortName).toBe("MUN");
    expect(player.price).toBe(9);
    expect(player.form).toBe(6.5);
    expect(player.expectedPointsNext).toBe(5.2);
  });

  it("renders a fallback when a pick cannot be mapped", () => {
    const squad = mapPicksToSquad(
      [pick({ element: 123, position: 1, multiplier: 1 })],
      new Map(),
    );

    expect(squad[0]?.name).toBe("Unknown Player (ID: 123)");
  });
});

describe("squad classification", () => {
  it("treats multiplier > 0 as starting XI and multiplier = 0 as bench", () => {
    expect(isStartingXi(1)).toBe(true);
    expect(isStartingXi(2)).toBe(true);
    expect(isStartingXi(0)).toBe(false);
    expect(isBench(0)).toBe(true);
    expect(isBench(1)).toBe(false);
  });

  it("classifies a 15-player squad into XI, bench, captain, and vice", () => {
    const playersById = new Map([
      [
        426,
        normalizePlayer(
          bruno,
          new Map(teams.map((team) => [team.id, team])),
          new Map(types.map((type) => [type.id, type])),
        ),
      ],
    ]);

    const picks: FplPick[] = [
      pick({ element: 1, position: 1, multiplier: 1 }),
      pick({ element: 426, position: 5, multiplier: 2, is_captain: true }),
      pick({ element: 3, position: 6, multiplier: 1, is_vice_captain: true }),
      pick({ element: 4, position: 12, multiplier: 0 }),
    ];

    const squad = mapPicksToSquad(picks, playersById);
    const classified = classifySquad(squad);

    expect(classified.startingXi).toHaveLength(3);
    expect(classified.bench).toHaveLength(1);
    expect(classified.captain?.id).toBe(426);
    expect(classified.captain?.name).toBe("Bruno Fernandes");
    expect(classified.viceCaptain?.id).toBe(3);
    expect(classified.viceCaptain?.isViceCaptain).toBe(true);
  });
});
