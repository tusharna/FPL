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
  elements: [],
};

vi.mock("../lib/fpl/bootstrap", () => ({
  getBootstrapStatic: async () => bootstrap,
}));
vi.mock("../lib/fpl/fixtures", () => ({
  getFixtures: async () => [],
}));
vi.mock("../lib/fpl/entry", () => ({
  getEntry: async () => ({
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
  }),
}));

describe("getNextGameweekPlanningData auth", () => {
  beforeEach(() => {
    clearFplAuthCache();
    delete process.env.FPL_REFRESH_TOKEN;
  });

  afterEach(() => {
    clearFplAuthCache();
    delete process.env.FPL_REFRESH_TOKEN;
  });

  it("returns AUTH_NOT_CONFIGURED when my-team auth is missing", async () => {
    const { getNextGameweekPlanningData } = await import("../lib/fpl/planning-data");
    const result = await getNextGameweekPlanningData(3944035);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("AUTH_NOT_CONFIGURED");
  });
});
