import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearFplAuthCache } from "../lib/fpl/auth";

const bootstrap = {
  events: [
    {
      id: 4,
      name: "Gameweek 4",
      deadline_time: "2026-09-06T05:00:00Z",
      finished: false,
      data_checked: false,
      is_previous: false,
      is_current: true,
      is_next: false,
    },
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
  elements: Array.from({ length: 15 }, (_, index) => ({
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
  })),
};

const entry = {
  id: 3944035,
  name: "Test FC",
  player_first_name: "Test",
  player_last_name: "Manager",
  summary_overall_points: 100,
  summary_overall_rank: 1000,
  summary_event_points: 50,
  summary_event_rank: 500,
  current_event: 4,
  last_deadline_bank: 10,
  last_deadline_value: 1000,
};

const intelligenceBundle = {
  players: [],
  impacts: [],
  keyAlerts: [],
  fixtureChanges: [],
  priceSignals: [],
  newsItems: [],
  conflicts: [],
  shouldRecalculate: false,
  fetchedAt: new Date().toISOString(),
  freshness: [],
  errors: [],
};

describe("getNextGameweekPlanningData", () => {
  beforeEach(() => {
    vi.resetModules();
    clearFplAuthCache();
    delete process.env.FPL_REFRESH_TOKEN;
  });

  afterEach(() => {
    clearFplAuthCache();
    vi.unstubAllGlobals();
    delete process.env.FPL_REFRESH_TOKEN;
  });

  it("uses my-team data and targets the next planning gameweek", async () => {
    process.env.FPL_REFRESH_TOKEN = "test-token";

    vi.doMock("../lib/fpl/bootstrap", () => ({
      getBootstrapStatic: async () => bootstrap,
    }));
    vi.doMock("../lib/fpl/fixtures", () => ({
      getFixtures: async () => [],
    }));
    vi.doMock("../lib/fpl/entry", () => ({
      getEntry: async () => entry,
    }));
    vi.doMock("../lib/fpl/my-team", async (importOriginal) => {
      const actual = await importOriginal<typeof import("../lib/fpl/my-team")>();
      return {
        ...actual,
        getMyTeam: async () => ({
          picks: Array.from({ length: 15 }, (_, index) => ({
            element: index + 1,
            position: index + 1,
            multiplier: index < 11 ? 1 : 0,
            is_captain: index === 1,
            is_vice_captain: index === 2,
          })),
          bank: 1,
          teamValue: 100,
          freeTransfers: 1,
          transfersMade: 0,
        }),
      };
    });
    vi.doMock("../lib/intelligence", () => ({
      runIntelligencePipeline: async () => intelligenceBundle,
    }));

    const { getNextGameweekPlanningData } = await import("../lib/fpl/planning-data");
    const result = await getNextGameweekPlanningData(3944035);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.planningGameweek.id).toBe(5);
    expect(result.data.analysis.gameweek).toBe(5);
    expect(result.data.squad).toHaveLength(15);
  });

});
