import { describe, expect, it } from "vitest";
import { detectGameweek } from "../lib/fpl/gameweek";
import { classifySquad, isBench, isStartingXi } from "../lib/fpl/normalize";
import type { FplEvent, SquadPlayer } from "../lib/fpl/types";

function event(partial: Partial<FplEvent> & Pick<FplEvent, "id">): FplEvent {
  return {
    name: `Gameweek ${partial.id}`,
    deadline_time: "2026-08-30T10:00:00Z",
    finished: false,
    data_checked: false,
    is_previous: false,
    is_current: false,
    is_next: false,
    ...partial,
  };
}

function squadPlayer(partial: Partial<SquadPlayer> & Pick<SquadPlayer, "id" | "multiplier">): SquadPlayer {
  return {
    name: `Player ${partial.id}`,
    webName: `P${partial.id}`,
    position: "MID",
    teamId: 1,
    teamName: "Club",
    teamShortName: "CLB",
    price: 6,
    form: 1,
    totalPoints: 10,
    pointsPerGame: 3,
    eventPoints: 2,
    expectedPointsNext: 3.1,
    expectedGoals: 0,
    expectedAssists: 0,
    expectedGoalInvolvement: 0,
    minutes: 90,
    starts: 1,
    ownership: 5,
    chanceOfPlaying: 100,
    news: "",
    squadPosition: partial.id,
    isCaptain: false,
    isViceCaptain: false,
    isStarting: partial.multiplier > 0,
    nextFixture: null,
    ...partial,
  };
}

describe("gameweek detection", () => {
  it("identifies the current and next gameweeks from events", () => {
    const info = detectGameweek([
      event({ id: 2, is_previous: true, finished: true }),
      event({ id: 3, is_current: true, deadline_time: "2026-08-30T11:00:00Z" }),
      event({ id: 4, is_next: true }),
    ]);

    expect(info.current?.id).toBe(3);
    expect(info.next?.id).toBe(4);
    expect(info.relevant.id).toBe(3);
    expect(info.deadline).toBe("2026-08-30T11:00:00Z");
    expect(info.isFinished).toBe(false);
  });

  it("falls back to the next gameweek when none is current", () => {
    const info = detectGameweek([
      event({ id: 3, is_previous: true, finished: true }),
      event({ id: 4, is_next: true, finished: false }),
    ]);

    expect(info.current).toBeNull();
    expect(info.relevant.id).toBe(4);
  });
});

describe("squad roles", () => {
  it("uses multiplier to separate starting XI from bench", () => {
    const squad = [
      squadPlayer({ id: 1, multiplier: 1 }),
      squadPlayer({ id: 2, multiplier: 2, isCaptain: true }),
      squadPlayer({ id: 3, multiplier: 1, isViceCaptain: true }),
      squadPlayer({ id: 4, multiplier: 0 }),
    ];

    const classified = classifySquad(squad);

    expect(classified.startingXi.every((player) => isStartingXi(player.multiplier))).toBe(true);
    expect(classified.bench.every((player) => isBench(player.multiplier))).toBe(true);
    expect(classified.startingXi).toHaveLength(3);
    expect(classified.bench).toHaveLength(1);
  });

  it("identifies the captain from is_captain", () => {
    const classified = classifySquad([
      squadPlayer({ id: 10, multiplier: 2, isCaptain: true, name: "Bruno Fernandes" }),
      squadPlayer({ id: 11, multiplier: 1, isViceCaptain: true }),
    ]);

    expect(classified.captain?.isCaptain).toBe(true);
    expect(classified.captain?.name).toBe("Bruno Fernandes");
  });

  it("identifies the vice-captain from is_vice_captain", () => {
    const classified = classifySquad([
      squadPlayer({ id: 10, multiplier: 2, isCaptain: true }),
      squadPlayer({ id: 11, multiplier: 1, isViceCaptain: true, name: "Palmer" }),
    ]);

    expect(classified.viceCaptain?.isViceCaptain).toBe(true);
    expect(classified.viceCaptain?.name).toBe("Palmer");
  });
});
