import { describe, expect, it } from "vitest";
import { ENGINE_VERSION } from "../lib/analysis/config";
import { formationFromPlayers } from "../lib/ai/input";
import type { DashboardPayload } from "../lib/fpl/dashboard-data";
import { analysisPlayer } from "./helpers";

function mockDashboardPayload(): DashboardPayload {
  const squadPlayer = (id: number, position: "GK" | "DEF" | "MID" | "FWD") => ({
    id,
    name: `Player ${id}`,
    webName: `P${id}`,
    position,
    teamId: 1,
    teamName: "Club",
    teamShortName: "CLB",
    price: 6,
    form: 5,
    totalPoints: 20,
    pointsPerGame: 4,
    eventPoints: 2,
    expectedPointsNext: 4,
    expectedGoals: 0.3,
    expectedAssists: 0.3,
    expectedGoalInvolvement: 0.6,
    minutes: 270,
    starts: 3,
    ownership: 10,
    chanceOfPlaying: 100,
    chanceOfPlayingThis: 100,
    news: "",
    status: "a",
    penaltiesOrder: null,
    squadPosition: id,
    isCaptain: id === 8,
    isViceCaptain: id === 9,
    isStarting: id <= 11,
    multiplier: id <= 11 ? (id === 8 ? 2 : 1) : 0,
    nextFixture: null,
  });

  const startingXi = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((id) =>
    squadPlayer(id, id <= 2 ? "GK" : id <= 7 ? "DEF" : id <= 10 ? "MID" : "FWD"),
  );
  const bench = [12, 13, 14, 15].map((id) =>
    squadPlayer(id, id === 12 ? "GK" : id <= 14 ? "DEF" : "MID"),
  );

  const recommendedXI = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14].map((id) =>
    analysisPlayer({ playerId: id, position: id <= 7 ? "DEF" : id <= 10 ? "MID" : "FWD" }),
  );
  const benchOrder = [1, 2, 12, 15].map((id) =>
    analysisPlayer({ playerId: id, position: id <= 2 ? "GK" : id === 12 ? "GK" : "DEF" }),
  );

  return {
    entryId: 3944035,
    gameweek: {
      current: null,
      next: null,
      relevant: {
        id: 2,
        name: "Gameweek 2",
        deadline_time: "2026-09-05T10:00:00Z",
        finished: false,
        data_checked: false,
        is_previous: false,
        is_current: true,
        is_next: false,
      },
      deadline: "2026-09-05T10:00:00Z",
      isFinished: false,
    },
    manager: {
      teamName: "Test FC",
      managerName: "Test Manager",
      teamValue: 100,
      bank: 1.5,
      totalPoints: 100,
      overallRank: 1000,
      gameweekPoints: 0,
    },
    squad: [...startingXi, ...bench],
    startingXi,
    bench,
    captain: startingXi.find((player) => player.isCaptain) ?? null,
    viceCaptain: startingXi.find((player) => player.isViceCaptain) ?? null,
    analysis: {
      gameweek: 2,
      recommendedFormation: "3-4-3",
      recommendedXI,
      benchOrder,
      captain: {
        player: analysisPlayer({ playerId: 8, position: "MID" }),
        score: 0.9,
        reasons: ["Top captain score"],
        confidence: "HIGH",
      },
      viceCaptain: {
        player: analysisPlayer({ playerId: 9, position: "MID" }),
        score: 0.8,
        reasons: ["Second best"],
        confidence: "MEDIUM",
      },
      lineupChanges: [],
      playerRisks: recommendedXI.map((player) => ({
        player,
        risk: "LOW" as const,
        reasons: ["No flags"],
      })),
      transferRecommendation: {
        action: "SAVE",
        reasons: ["SAVE TRANSFER"],
      },
      topTransferCandidates: [],
      fixtureOutlook: [],
      generatedAt: "2026-09-02T00:00:00.000Z",
    },
    intelligence: {
      gameweekId: 2,
      fetchedAt: "2026-09-02T00:00:00.000Z",
      freshness: [],
      availability: [],
      players: [],
      fixtureChanges: [],
      fixtureIntelligence: [],
      priceSignals: [],
      news: [],
      conflicts: [],
      impacts: [],
      keyAlerts: [],
      shouldRecalculate: false,
      errors: [],
    },
  };
}

describe("history persistence helpers", () => {
  it("builds formation labels from stored squad data", () => {
    const payload = mockDashboardPayload();
    expect(formationFromPlayers(payload.startingXi)).toBe("5-3-1");
    expect(ENGINE_VERSION).toBe("2.0.0");
  });

  it("keeps recommendation identity stable for idempotent saves", () => {
    const first = mockDashboardPayload();
    const second = mockDashboardPayload();
    second.analysis.captain.player = analysisPlayer({
      playerId: 99,
      position: "FWD",
      webName: "Changed",
    });

    expect(first.analysis.gameweek).toBe(second.analysis.gameweek);
    expect(first.entryId).toBe(second.entryId);
    expect(first.analysis.captain.player.playerId).not.toBe(
      second.analysis.captain.player.playerId,
    );
  });
});
