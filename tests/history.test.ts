import { describe, expect, it } from "vitest";
import {
  computeHistoryMetrics,
  evaluateRecommendation,
} from "../lib/history";
import type {
  ActualResultRow,
  RecommendationPlayerRow,
  RecommendationRow,
  TeamSnapshotRow,
} from "../lib/db/schema";

function recommendation(overrides: Partial<RecommendationRow> = {}): RecommendationRow {
  return {
    id: 1,
    entry_id: 3944035,
    gameweek_id: 2,
    current_formation: "3-5-2",
    recommended_formation: "3-4-3",
    captain_player_id: 10,
    vice_captain_player_id: 11,
    transfer_action: "TRANSFER",
    transfer_out_player_id: 5,
    transfer_in_player_id: 8,
    engine_version: "2.0.0",
    generated_at: "2026-09-02T00:00:00.000Z",
    ...overrides,
  };
}

function teamSnapshot(
  rows: Array<Partial<TeamSnapshotRow> & Pick<TeamSnapshotRow, "player_id" | "is_starting">>,
): TeamSnapshotRow[] {
  return rows.map((row, index) => ({
    id: index + 1,
    entry_id: 3944035,
    gameweek_id: 2,
    squad_position: index + 1,
    is_captain: false,
    is_vice_captain: false,
    multiplier: row.is_starting ? 1 : 0,
    purchase_price: 6,
    selling_price: 6,
    created_at: "2026-09-02T00:00:00.000Z",
    ...row,
  }));
}

function recommendationPlayers(
  rows: Array<Partial<RecommendationPlayerRow> & Pick<RecommendationPlayerRow, "player_id" | "is_starting">>,
): RecommendationPlayerRow[] {
  return rows.map((row, index) => ({
    id: index + 1,
    recommendation_id: 1,
    squad_position: row.is_starting ? index + 1 : null,
    bench_order: row.is_starting ? null : index + 1,
    overall_score: 0.8,
    fixture_score: 0.7,
    expected_points: 4,
    created_at: "2026-09-02T00:00:00.000Z",
    ...row,
  }));
}

function actualResults(
  rows: Array<Partial<ActualResultRow> & Pick<ActualResultRow, "player_id" | "points">>,
): ActualResultRow[] {
  return rows.map((row, index) => ({
    id: index + 1,
    gameweek_id: 2,
    minutes: 90,
    goals: 0,
    assists: 0,
    clean_sheets: 0,
    bonus: 0,
    created_at: "2026-09-02T00:00:00.000Z",
    ...row,
  }));
}

describe("recommendation evaluation", () => {
  it("calculates recommended XI points with captain multiplier", () => {
    const rec = recommendation();
    const team = teamSnapshot([
      { player_id: 1, is_starting: true, is_captain: true },
      { player_id: 2, is_starting: true },
      { player_id: 3, is_starting: false },
    ]);
    const recPlayers = recommendationPlayers([
      { player_id: 10, is_starting: true },
      { player_id: 11, is_starting: true },
      { player_id: 12, is_starting: false },
    ]);
    const results = actualResults([
      { player_id: 1, points: 2 },
      { player_id: 2, points: 5 },
      { player_id: 3, points: 8 },
      { player_id: 10, points: 6 },
      { player_id: 11, points: 4 },
      { player_id: 12, points: 1 },
    ]);

    const evaluation = evaluateRecommendation({
      gameweekId: 2,
      recommendation: rec,
      recommendationPlayers: recPlayers,
      teamSnapshot: team,
      actualResults: results,
      playerNames: {
        1: "Actual Captain",
        2: "Starter",
        3: "Bench",
        10: "Recommended Captain",
        11: "Recommended Vice",
        12: "Bench",
      },
    });

    expect(evaluation).not.toBeNull();
    expect(evaluation?.actualTeamPoints).toBe(9);
    expect(evaluation?.recommendedTeamPoints).toBe(16);
    expect(evaluation?.benchPoints).toBe(8);
    expect(evaluation?.lineupDelta).toBe(7);
    expect(evaluation?.recommendedCaptain.points).toBe(12);
  });

  it("uses vice captain when actual captain does not play", () => {
    const rec = recommendation({ captain_player_id: 1, vice_captain_player_id: 2 });
    const team = teamSnapshot([
      { player_id: 1, is_starting: true, is_captain: true },
      { player_id: 2, is_starting: true, is_vice_captain: true },
    ]);
    const recPlayers = recommendationPlayers([
      { player_id: 1, is_starting: true },
      { player_id: 2, is_starting: true },
    ]);
    const results = actualResults([
      { player_id: 1, points: 3, minutes: 0 },
      { player_id: 2, points: 4, minutes: 90 },
    ]);

    const evaluation = evaluateRecommendation({
      gameweekId: 2,
      recommendation: rec,
      recommendationPlayers: recPlayers,
      teamSnapshot: team,
      actualResults: results,
      playerNames: { 1: "Captain", 2: "Vice" },
    });

    expect(evaluation?.actualTeamPoints).toBe(8);
    expect(evaluation?.actualCaptain.points).toBe(8);
  });

  it("calculates transfer impact for stored transfer recommendations", () => {
    const rec = recommendation({
      transfer_action: "TRANSFER",
      transfer_out_player_id: 5,
      transfer_in_player_id: 8,
    });
    const evaluation = evaluateRecommendation({
      gameweekId: 2,
      recommendation: rec,
      recommendationPlayers: recommendationPlayers([
        { player_id: 8, is_starting: true },
      ]),
      teamSnapshot: teamSnapshot([{ player_id: 5, is_starting: true }]),
      actualResults: actualResults([
        { player_id: 5, points: 2 },
        { player_id: 8, points: 7 },
      ]),
      playerNames: { 5: "Out", 8: "In" },
      transferCost: 0,
    });

    expect(evaluation?.transfer.transferImpact).toBe(5);
    expect(evaluation?.transfer.playerOut).toBe("Out");
    expect(evaluation?.transfer.playerIn).toBe("In");
  });
});

describe("history metrics", () => {
  it("aggregates captain success and lineup deltas", () => {
    const metrics = computeHistoryMetrics([
      {
        gameweek: 1,
        actualTeamPoints: 50,
        recommendedTeamPoints: 55,
        actualCaptain: { player: "A", points: 8 },
        recommendedCaptain: { player: "A", points: 8 },
        captainDelta: 0,
        benchPoints: 6,
        lineupDelta: 5,
        transfer: { action: "SAVE" },
        captainCorrect: true,
        transferPositive: null,
      },
      {
        gameweek: 2,
        actualTeamPoints: 40,
        recommendedTeamPoints: 46,
        actualCaptain: { player: "B", points: 4 },
        recommendedCaptain: { player: "C", points: 10 },
        captainDelta: 6,
        benchPoints: 8,
        lineupDelta: 6,
        transfer: { action: "TRANSFER", transferImpact: 3 },
        captainCorrect: false,
        transferPositive: true,
      },
    ]);

    expect(metrics.gameweeksEvaluated).toBe(2);
    expect(metrics.averageXiImprovement).toBe(5.5);
    expect(metrics.captainSuccessRate).toBe(0.5);
    expect(metrics.positiveTransferRate).toBe(1);
    expect(metrics.averageBenchPoints).toBe(7);
    expect(metrics.bestGameweek).toBe(2);
    expect(metrics.worstGameweek).toBe(1);
  });
});
