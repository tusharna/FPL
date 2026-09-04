import { indexById } from "@/lib/fpl/normalize";
import type { FplFixture, FplTeam, Player, SquadPlayer } from "@/lib/fpl/types";
import { orderBench } from "./bench";
import { selectCaptaincy } from "./captain";
import { describeFixtureScore } from "./fixtures";
import { compareLineups, selectBestXi } from "./lineup";
import { analyzePlayers } from "./player";
import { riskLevelFromScores, riskReasons } from "./risk";
import { findTransferCandidates, recommendTransfer } from "./transfers";
import type { GameweekAnalysis } from "./types";
import type { PlayerIntelligence } from "@/lib/intelligence/types";

export function analyzeGameweek(input: {
  gameweek: number;
  squad: SquadPlayer[];
  startingXiIds: number[];
  bank: number;
  allPlayers: Player[];
  fixtures: FplFixture[];
  teams: FplTeam[];
  generatedAt?: string;
  intelligenceById?: Map<number, PlayerIntelligence>;
}): GameweekAnalysis {
  const teamsById = indexById(input.teams);
  const context = {
    fixtures: input.fixtures,
    teamsById,
    fromEventId: input.gameweek,
    intelligenceById: input.intelligenceById,
  };

  const squadPlayers: Player[] = input.squad;
  const market = analyzePlayers(input.allPlayers, context);
  const marketById = new Map(market.map((player) => [player.playerId, player]));
  const squadAnalysis = squadPlayers.map((player) => {
    return marketById.get(player.id) ?? analyzePlayers([player], context)[0]!;
  });
  const squadById = new Map(
    squadAnalysis.map((player) => [player.playerId, player]),
  );
  const { formation, xi } = selectBestXi(squadAnalysis);
  const benchOrder = orderBench(squadAnalysis, xi);
  const { captain, viceCaptain } = selectCaptaincy(xi);
  const lineupChanges = compareLineups(input.startingXiIds, xi, squadById);

  const playersById = new Map(input.allPlayers.map((player) => [player.id, player]));
  const topTransferCandidates = findTransferCandidates({
    squad: squadPlayers,
    squadAnalysis,
    market,
    playersById,
    bank: input.bank,
  }).slice(0, 8);

  return {
    gameweek: input.gameweek,
    recommendedFormation: formation.label,
    recommendedXI: xi,
    benchOrder,
    captain,
    viceCaptain,
    lineupChanges,
    playerRisks: squadAnalysis.map((player) => ({
      player,
      risk: riskLevelFromScores(player.availabilityRisk, player.minutesRisk),
      reasons: riskReasons(player),
    })),
    transferRecommendation: recommendTransfer(topTransferCandidates),
    topTransferCandidates,
    fixtureOutlook: squadAnalysis.map((player) => ({
      playerId: player.playerId,
      name: player.webName,
      position: player.position,
      fixtureScore: player.fixtureScore,
      fixtureScoreMedium: player.fixtureScoreMedium,
      summary: describeFixtureScore(player.fixtureScore),
    })),
    generatedAt: input.generatedAt ?? new Date().toISOString(),
  };
}
