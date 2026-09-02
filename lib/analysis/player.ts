import type { FplFixture, FplTeam, Player } from "@/lib/fpl/types";
import {
  FIXTURE_HORIZON,
  MEDIUM_TERM_HORIZON,
  SHORT_TERM_HORIZON,
} from "./config";
import { scoreFixturesForTeam } from "./fixtures";
import {
  availabilityRiskFromPlayer,
  minutesRiskFromPlayer,
  minutesSecurityFromRisk,
} from "./risk";
import {
  attackingPotential,
  overallScoreFromParts,
  transferScoreFromParts,
} from "./score";
import type { PlayerAnalysis } from "./types";

export type AnalysisContext = {
  fixtures: FplFixture[];
  teamsById: Map<number, FplTeam>;
  fromEventId: number;
};

export function analyzePlayer(
  player: Player,
  context: AnalysisContext,
): PlayerAnalysis {
  const fixtureScore = scoreFixturesForTeam(
    player.teamId,
    player.position,
    context.fixtures,
    context.teamsById,
    context.fromEventId,
    SHORT_TERM_HORIZON,
  );
  const fixtureHorizon = scoreFixturesForTeam(
    player.teamId,
    player.position,
    context.fixtures,
    context.teamsById,
    context.fromEventId,
    FIXTURE_HORIZON,
  );
  const fixtureScoreMedium = scoreFixturesForTeam(
    player.teamId,
    player.position,
    context.fixtures,
    context.teamsById,
    context.fromEventId,
    MEDIUM_TERM_HORIZON,
  );
  const availabilityRisk = availabilityRiskFromPlayer(player);
  const minutesRisk = minutesRiskFromPlayer(player);
  const minutesSecurity = minutesSecurityFromRisk(minutesRisk);
  const attack = attackingPotential(
    player.position,
    player.expectedGoalInvolvement,
    player.form,
  );

  return {
    playerId: player.id,
    name: player.name,
    webName: player.webName,
    position: player.position,
    teamId: player.teamId,
    teamShortName: player.teamShortName,
    price: player.price,
    form: player.form,
    totalPoints: player.totalPoints,
    pointsPerGame: player.pointsPerGame,
    expectedPointsNext: player.expectedPointsNext,
    expectedGoals: player.expectedGoals,
    expectedAssists: player.expectedAssists,
    expectedGoalInvolvement: player.expectedGoalInvolvement,
    minutes: player.minutes,
    starts: player.starts,
    ownership: player.ownership,
    chanceOfPlaying: player.chanceOfPlaying,
    chanceOfPlayingThis: player.chanceOfPlayingThis,
    news: player.news,
    penaltiesOrder: player.penaltiesOrder,
    fixtureScore,
    fixtureScoreMedium,
    availabilityRisk,
    minutesRisk,
    minutesSecurity,
    overallScore: overallScoreFromParts({
      expectedPoints: player.expectedPointsNext,
      fixtureScore: fixtureHorizon,
      form: player.form,
      minutesSecurity,
      attackingPotential: attack,
      availabilityRisk,
    }),
    transferScore: transferScoreFromParts({
      expectedPoints: player.expectedPointsNext,
      fixtureScore,
      form: player.form,
      minutesSecurity,
      expectedGoalInvolvement: player.expectedGoalInvolvement,
      price: player.price,
      mediumTermFixtures: fixtureScoreMedium,
      availabilityRisk,
    }),
  };
}

export function analyzePlayers(
  players: Player[],
  context: AnalysisContext,
): PlayerAnalysis[] {
  return players.map((player) => analyzePlayer(player, context));
}
