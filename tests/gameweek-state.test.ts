import { describe, expect, it } from "vitest";
import {
  getGameweekState,
  getPlanningGameweek,
  isValidPlanningTarget,
} from "../lib/fpl/gameweek-state";
import type { FplEvent } from "../lib/fpl/types";

function event(partial: Partial<FplEvent> & Pick<FplEvent, "id">): FplEvent {
  return {
    name: `Gameweek ${partial.id}`,
    deadline_time: "2026-09-13T05:00:00Z",
    finished: false,
    data_checked: false,
    is_previous: false,
    is_current: false,
    is_next: false,
    ...partial,
  };
}

describe("getGameweekState", () => {
  it("returns FINISHED for finished events", () => {
    expect(getGameweekState(event({ id: 1, finished: true }))).toBe("FINISHED");
  });

  it("returns IN_PROGRESS for current events", () => {
    expect(getGameweekState(event({ id: 2, is_current: true }))).toBe(
      "IN_PROGRESS",
    );
  });

  it("returns UPCOMING for next events", () => {
    expect(getGameweekState(event({ id: 3, is_next: true }))).toBe("UPCOMING");
  });
});

describe("getPlanningGameweek", () => {
  it("plans for next GW when current GW is in progress", () => {
    const result = getPlanningGameweek([
      event({ id: 3, is_previous: true, finished: true }),
      event({ id: 4, is_current: true, finished: false }),
      event({ id: 5, is_next: true, finished: false }),
    ]);

    expect(result?.currentGameweek?.id).toBe(4);
    expect(result?.currentState).toBe("IN_PROGRESS");
    expect(result?.planningGameweek.id).toBe(5);
    expect(result?.planningState).toBe("UPCOMING");
  });

  it("plans for the upcoming GW when none is current", () => {
    const result = getPlanningGameweek([
      event({ id: 3, is_previous: true, finished: true }),
      event({ id: 4, is_next: true, finished: false }),
    ]);

    expect(result?.planningGameweek.id).toBe(4);
    expect(result?.planningState).toBe("UPCOMING");
  });

  it("plans for next upcoming when current GW is finished", () => {
    const result = getPlanningGameweek([
      event({ id: 3, finished: true, is_previous: true }),
      event({ id: 4, finished: true, is_current: true }),
      event({ id: 5, is_next: true, finished: false }),
    ]);

    expect(result?.planningGameweek.id).toBe(5);
  });

  it("returns null when no upcoming gameweek exists", () => {
    const result = getPlanningGameweek([
      event({ id: 3, finished: true }),
      event({ id: 4, finished: true, is_current: true }),
    ]);

    expect(result).toBeNull();
  });
});

describe("isValidPlanningTarget", () => {
  it("accepts only the current planning gameweek", () => {
    const events = [
      event({ id: 3, is_previous: true, finished: true }),
      event({ id: 4, is_current: true }),
      event({ id: 5, is_next: true }),
    ];

    expect(isValidPlanningTarget(events, 5)).toBe(true);
    expect(isValidPlanningTarget(events, 4)).toBe(false);
  });
});
