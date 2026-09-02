import type { Player } from "../lib/fpl/types";
import type { PlayerAnalysis } from "../lib/analysis/types";

export function analysisPlayer(
  partial: Partial<PlayerAnalysis> &
    Pick<PlayerAnalysis, "playerId" | "position">,
): PlayerAnalysis {
  return {
    name: `Player ${partial.playerId}`,
    webName: `P${partial.playerId}`,
    teamId: 1,
    teamShortName: "CLB",
    price: 6,
    form: 5,
    totalPoints: 20,
    pointsPerGame: 4,
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
    penaltiesOrder: null,
    fixtureScore: 0.7,
    fixtureScoreMedium: 0.65,
    availabilityRisk: 0.05,
    minutesRisk: 0.1,
    minutesSecurity: 0.9,
    overallScore: 0.6,
    transferScore: 0.55,
    ...partial,
  };
}

export function ownedPlayer(
  partial: Partial<Player> & Pick<Player, "id" | "position">,
): Player {
  return {
    name: `Player ${partial.id}`,
    webName: `P${partial.id}`,
    teamId: partial.teamId ?? 1,
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
    ...partial,
  };
}

export function standardSquad(): Player[] {
  const ids = [
    ...[1, 2].map((id) => ownedPlayer({ id, position: "GK", teamId: id })),
    ...[3, 4, 5, 6, 7].map((id) =>
      ownedPlayer({ id, position: "DEF", teamId: id }),
    ),
    ...[8, 9, 10, 11, 12].map((id) =>
      ownedPlayer({ id, position: "MID", teamId: id }),
    ),
    ...[13, 14, 15].map((id) => ownedPlayer({ id, position: "FWD", teamId: id })),
  ];
  return ids;
}

export function scoredSquad(): PlayerAnalysis[] {
  return [
    analysisPlayer({ playerId: 1, position: "GK", overallScore: 0.5 }),
    analysisPlayer({ playerId: 2, position: "GK", overallScore: 0.3 }),
    analysisPlayer({ playerId: 3, position: "DEF", overallScore: 0.9 }),
    analysisPlayer({ playerId: 4, position: "DEF", overallScore: 0.8 }),
    analysisPlayer({ playerId: 5, position: "DEF", overallScore: 0.7 }),
    analysisPlayer({ playerId: 6, position: "DEF", overallScore: 0.4 }),
    analysisPlayer({ playerId: 7, position: "DEF", overallScore: 0.2 }),
    analysisPlayer({ playerId: 8, position: "MID", overallScore: 0.95 }),
    analysisPlayer({ playerId: 9, position: "MID", overallScore: 0.85 }),
    analysisPlayer({ playerId: 10, position: "MID", overallScore: 0.75 }),
    analysisPlayer({ playerId: 11, position: "MID", overallScore: 0.35 }),
    analysisPlayer({ playerId: 12, position: "MID", overallScore: 0.15 }),
    analysisPlayer({ playerId: 13, position: "FWD", overallScore: 0.88 }),
    analysisPlayer({ playerId: 14, position: "FWD", overallScore: 0.6 }),
    analysisPlayer({ playerId: 15, position: "FWD", overallScore: 0.25 }),
  ];
}
