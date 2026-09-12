import { afterEach, describe, expect, it, vi } from "vitest";
import { clearFplAuthCache } from "../lib/fpl/auth";
import { normalizeMyTeamSquad } from "../lib/fpl/my-team";
import type { FplBootstrapStatic, FplFixture } from "../lib/fpl/types";

const validMyTeamResponse = {
  picks: Array.from({ length: 15 }, (_, index) => ({
    element: index + 1,
    position: index + 1,
    multiplier: index < 11 ? 1 : 0,
    is_captain: index === 1,
    is_vice_captain: index === 2,
    selling_price: 60,
    purchase_price: 60,
  })),
  transfers: {
    bank: 15,
    limit: 1,
    made: 0,
    value: 1000,
  },
  chips: [],
};

function bootstrapFixture(): FplBootstrapStatic {
  const elements = Array.from({ length: 15 }, (_, index) => ({
    id: index + 1,
    first_name: "Player",
    second_name: String(index + 1),
    web_name: `P${index + 1}`,
    team: 1,
    element_type: index < 2 ? 1 : index < 7 ? 2 : index < 12 ? 3 : 4,
    now_cost: 60,
    form: "3.0",
    total_points: 10,
    points_per_game: "3.0",
    event_points: 2,
    ep_next: "3.0",
    ep_this: "3.0",
    expected_goals: "0",
    expected_assists: "0",
    expected_goal_involvements: "0",
    minutes: 90,
    starts: 1,
    selected_by_percent: "5.0",
    chance_of_playing_this_round: 100,
    chance_of_playing_next_round: 100,
    news: "",
    status: "a",
    penalties_order: null,
  }));

  return {
    events: [
      {
        id: 5,
        name: "Gameweek 5",
        deadline_time: "2026-09-13T05:00:00Z",
        finished: false,
        data_checked: false,
        is_previous: false,
        is_current: false,
        is_next: true,
      },
    ],
    teams: [{ id: 1, name: "Club", short_name: "CLB" }],
    element_types: [
      { id: 1, singular_name: "Goalkeeper", singular_name_short: "GKP", element_count: 2 },
      { id: 2, singular_name: "Defender", singular_name_short: "DEF", element_count: 5 },
      { id: 3, singular_name: "Midfielder", singular_name_short: "MID", element_count: 5 },
      { id: 4, singular_name: "Forward", singular_name_short: "FWD", element_count: 3 },
    ],
    elements,
  };
}

describe("normalizeMyTeamSquad", () => {
  it("normalizes a valid my-team response into 15 squad players", () => {
    const bootstrap = bootstrapFixture();
    const result = normalizeMyTeamSquad({
      myTeam: {
        picks: validMyTeamResponse.picks.map((pick) => ({
          element: pick.element,
          position: pick.position,
          multiplier: pick.multiplier,
          is_captain: pick.is_captain,
          is_vice_captain: pick.is_vice_captain,
        })),
        bank: 1.5,
        teamValue: 100,
        freeTransfers: 1,
        transfersMade: 0,
      },
      bootstrap,
      fixtures: [] as FplFixture[],
      planningGameweekId: 5,
    });

    expect(result.squad).toHaveLength(15);
    expect(result.startingXi).toHaveLength(11);
    expect(result.bench).toHaveLength(4);
    expect(result.bank).toBe(1.5);
    expect(result.teamValue).toBe(100);
    expect(result.captain?.id).toBe(2);
  });
});

describe("getMyTeam", () => {
  afterEach(() => {
    clearFplAuthCache();
    vi.unstubAllGlobals();
    delete process.env.FPL_REFRESH_TOKEN;
  });

  it("throws when FPL auth is not configured", async () => {
    const { getMyTeam } = await import("../lib/fpl/my-team");
    await expect(getMyTeam(3944035)).rejects.toMatchObject({
      name: "FplAuthNotConfiguredError",
    });
  });

  it("normalizes bank and team value from tenths", async () => {
    process.env.FPL_REFRESH_TOKEN = "test-refresh-token";

    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("account.premierleague.com")) {
        return {
          ok: true,
          json: async () => ({
            access_token: "test-access",
            expires_in: 300,
          }),
        };
      }
      return {
        ok: true,
        json: async () => validMyTeamResponse,
      };
    }));

    const { getMyTeam } = await import("../lib/fpl/my-team");
    const result = await getMyTeam(3944035);

    expect(result.picks).toHaveLength(15);
    expect(result.bank).toBe(1.5);
    expect(result.teamValue).toBe(100);
  });
});
