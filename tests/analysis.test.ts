import { describe, expect, it } from "vitest";
import { orderBench } from "../lib/analysis/bench";
import { captainScore, selectCaptaincy } from "../lib/analysis/captain";
import { fdrToScore, scoreFixturesForTeam } from "../lib/analysis/fixtures";
import {
  LEGAL_FORMATIONS,
  compareLineups,
  isLegalFormationCounts,
  pickPlayersForFormation,
  selectBestXi,
} from "../lib/analysis/lineup";
import { availabilityRiskFromPlayer, minutesRiskFromPlayer, riskLevelFromScores } from "../lib/analysis/risk";
import { analysisPlayer, ownedPlayer, scoredSquad } from "./helpers";

describe("legal formations", () => {
  it("accepts every supported FPL formation", () => {
    for (const formation of LEGAL_FORMATIONS) {
      expect(
        isLegalFormationCounts(
          formation.defenders,
          formation.midfielders,
          formation.forwards,
        ),
      ).toBe(true);
    }
    expect(LEGAL_FORMATIONS.map((formation) => formation.label).sort()).toEqual(
      ["3-4-3", "3-5-2", "4-3-3", "4-4-2", "4-5-1", "5-2-3", "5-3-2", "5-4-1"].sort(),
    );
  });

  it("rejects illegal formations", () => {
    expect(isLegalFormationCounts(2, 5, 3)).toBe(false);
    expect(isLegalFormationCounts(6, 3, 1)).toBe(false);
    expect(isLegalFormationCounts(4, 4, 3)).toBe(false);
    expect(isLegalFormationCounts(3, 3, 4)).toBe(false);
    expect(isLegalFormationCounts(4, 4, 2, 0)).toBe(false);
    expect(isLegalFormationCounts(5, 5, 1)).toBe(false);
  });
});

describe("lineup comparison", () => {
  it("describes players moving in and out of the XI", () => {
    const squad = scoredSquad();
    const recommended = selectBestXi(squad).xi;
    const currentIds = [1, 3, 4, 5, 6, 8, 9, 10, 11, 13, 14];
    const changes = compareLineups(
      currentIds,
      recommended,
      new Map(squad.map((player) => [player.playerId, player])),
    );
    expect(Array.isArray(changes)).toBe(true);
  });
});

describe("best XI", () => {
  it("evaluates formations instead of sorting all 15 players", () => {
    const squad = scoredSquad();
    const best = selectBestXi(squad);
    expect(best.xi).toHaveLength(11);
    expect(best.xi.filter((player) => player.position === "GK")).toHaveLength(1);
    expect(best.xi.map((player) => player.playerId)).not.toContain(12);
    expect(best.xi.map((player) => player.playerId)).not.toContain(7);
  });

  it("picks the highest-scoring eligible players for 3-4-3", () => {
    const xi = pickPlayersForFormation(
      scoredSquad(),
      LEGAL_FORMATIONS.find((formation) => formation.label === "3-4-3")!,
    );
    expect(xi?.map((player) => player.playerId)).toEqual([
      1, 3, 4, 5, 8, 9, 10, 11, 13, 14, 15,
    ]);
  });
});

describe("captaincy", () => {
  it("selects captain and vice from expected points and xGI, not total points", () => {
    const xi = [
      analysisPlayer({
        playerId: 100,
        position: "MID",
        totalPoints: 200,
        expectedPointsNext: 2,
        expectedGoalInvolvement: 0.1,
        form: 2,
        fixtureScore: 0.3,
        minutesSecurity: 0.5,
      }),
      analysisPlayer({
        playerId: 101,
        position: "FWD",
        totalPoints: 40,
        expectedPointsNext: 8,
        expectedGoals: 1.1,
        expectedAssists: 0.4,
        expectedGoalInvolvement: 1.5,
        form: 8,
        fixtureScore: 0.9,
        minutesSecurity: 0.95,
        availabilityRisk: 0,
      }),
      analysisPlayer({
        playerId: 102,
        position: "MID",
        totalPoints: 90,
        expectedPointsNext: 6.5,
        expectedGoalInvolvement: 1.1,
        form: 7,
        fixtureScore: 0.8,
        minutesSecurity: 0.9,
      }),
    ];

    expect(captainScore(xi[1]!)).toBeGreaterThan(captainScore(xi[0]!));
    const { captain, viceCaptain } = selectCaptaincy(xi);
    expect(captain.player.playerId).toBe(101);
    expect(viceCaptain.player.playerId).toBe(102);
    expect(captain.reasons.length).toBeGreaterThan(0);
  });
});

describe("bench order", () => {
  it("places the unused goalkeeper first, then outfield by bench score", () => {
    const squad = scoredSquad();
    const xi = selectBestXi(squad).xi;
    const bench = orderBench(squad, xi);
    expect(bench).toHaveLength(4);
    expect(bench[0]?.position).toBe("GK");
    expect(bench[0]?.playerId).toBe(2);
  });
});

describe("availability and minutes risk", () => {
  it("flags injured and low-minute players", () => {
    const injured = ownedPlayer({
      id: 1,
      position: "MID",
      status: "i",
      chanceOfPlaying: 0,
      news: "Knee injury - Unknown return date",
    });
    const rotation = ownedPlayer({
      id: 2,
      position: "DEF",
      minutes: 20,
      starts: 3,
      chanceOfPlaying: 100,
    });

    expect(availabilityRiskFromPlayer(injured)).toBeGreaterThan(0.9);
    expect(minutesRiskFromPlayer(rotation)).toBeGreaterThan(0.4);
    expect(riskLevelFromScores(0.9, 0.1)).toBe("HIGH");
    expect(riskLevelFromScores(0.1, 0.1)).toBe("LOW");
    expect(riskLevelFromScores(0.3, 0.35)).toBe("MEDIUM");
  });
});

describe("fixture scoring", () => {
  it("maps FDR 1-5 onto the 1.0-0.2 scale", () => {
    expect(fdrToScore(1)).toBe(1);
    expect(fdrToScore(3)).toBe(0.6);
    expect(fdrToScore(5)).toBe(0.2);
  });

  it("scores a home fixture against a weak attack as favorable for defenders", () => {
    const teams = new Map([
      [
        2,
        {
          id: 2,
          name: "Weak",
          short_name: "WEK",
          strength_attack_away: 1020,
          strength_defence_away: 1350,
        },
      ],
    ]);
    const score = scoreFixturesForTeam(
      1,
      "DEF",
      [
        {
          id: 10,
          event: 3,
          team_h: 1,
          team_a: 2,
          team_h_score: null,
          team_a_score: null,
          finished: false,
          kickoff_time: null,
          team_h_difficulty: 2,
        },
      ],
      teams,
      3,
      1,
    );
    expect(score).toBeGreaterThan(0.6);
  });
});
