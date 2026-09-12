import { cache } from "react";
import { analyzeGameweek } from "@/lib/analysis/team";
import type { GameweekAnalysis } from "@/lib/analysis/types";
import { getAuthenticatedFplEntryId } from "@/lib/auth/user";
import { runIntelligencePipeline } from "@/lib/intelligence";
import type { IntelligenceBundle } from "@/lib/intelligence/types";
import { getBootstrapStatic } from "./bootstrap";
import { getEntry } from "./entry";
import { getFixtures } from "./fixtures";
import { detectGameweek } from "./gameweek";
import {
  getPlanningGameweek,
  getPlanningPreparePath,
  type PlanningGameweekContext,
} from "./gameweek-state";
import {
  attachFixtures,
  classifySquad,
  indexById,
  mapPicksToSquad,
  normalizePlayer,
  tenthsToMillions,
} from "./normalize";
import { getPicks } from "./picks";
import type { DashboardData, Player } from "./types";

export type PlanningBanner = {
  planningContext: PlanningGameweekContext;
  prepareHref: string;
  headline: string;
  subline: string;
};

export type DashboardPayload = DashboardData & {
  analysis: GameweekAnalysis;
  intelligence: IntelligenceBundle;
  planning: PlanningBanner | null;
};

export const getDashboardData = cache(async function getDashboardData(
  entryId: number,
): Promise<DashboardPayload> {
  const [bootstrap, fixtures] = await Promise.all([
    getBootstrapStatic(),
    getFixtures(),
  ]);

  const gameweek = detectGameweek(bootstrap.events);
  const [entry, picksResponse] = await Promise.all([
    getEntry(entryId),
    getPicks(entryId, gameweek.relevant.id),
  ]);

  const teamsById = indexById(bootstrap.teams);
  const typesById = indexById(bootstrap.element_types);
  const allPlayers = bootstrap.elements.map((element) =>
    normalizePlayer(element, teamsById, typesById),
  );
  const playersById = new Map<number, Player>(
    allPlayers.map((player) => [player.id, player]),
  );

  const mapped = mapPicksToSquad(picksResponse.picks, playersById);
  const squad = attachFixtures(
    mapped,
    fixtures,
    teamsById,
    gameweek.relevant.id,
  );
  const { startingXi, bench, captain, viceCaptain } = classifySquad(squad);

  const history = picksResponse.entry_history;
  const bank = tenthsToMillions(history?.bank ?? entry.last_deadline_bank);

  const analysis = analyzeGameweek({
    gameweek: gameweek.relevant.id,
    squad,
    startingXiIds: startingXi.map((player) => player.id),
    bank,
    allPlayers,
    fixtures,
    teams: bootstrap.teams,
  });

  const squadIds = new Set(squad.map((player) => player.id));
  const squadPlayers = allPlayers.filter((player) => squadIds.has(player.id));

  const intelligence = await runIntelligencePipeline({
    gameweekId: gameweek.relevant.id,
    entryId,
    squad: squadPlayers,
    allPlayers,
    fixtures,
    teamsById,
    captainId: captain?.id,
    viceCaptainId: viceCaptain?.id,
    transferPlayerIds: [
      analysis.transferRecommendation.playerOut?.playerId,
      analysis.transferRecommendation.playerIn?.playerId,
    ].filter((id): id is number => id != null),
    recommendedXiIds: analysis.recommendedXI.map((player) => player.playerId),
  });

  const intelligenceById = new Map(
    intelligence.players.map((player) => [player.playerId, player]),
  );

  const finalAnalysis =
    intelligence.shouldRecalculate
      ? analyzeGameweek({
          gameweek: gameweek.relevant.id,
          squad,
          startingXiIds: startingXi.map((player) => player.id),
          bank,
          allPlayers,
          fixtures,
          teams: bootstrap.teams,
          intelligenceById,
        })
      : analysis;

  const planningContext = getPlanningGameweek(bootstrap.events);
  const planning = planningContext
    ? buildPlanningBanner(planningContext, gameweek)
    : null;

  return {
    entryId,
    gameweek,
    planning,
    manager: {
      teamName: entry.name,
      managerName: `${entry.player_first_name} ${entry.player_last_name}`.trim(),
      teamValue: tenthsToMillions(history?.value ?? entry.last_deadline_value),
      bank,
      totalPoints: history?.total_points ?? entry.summary_overall_points,
      overallRank: history?.overall_rank ?? entry.summary_overall_rank,
      gameweekPoints: history?.points ?? entry.summary_event_points,
    },
    squad,
    startingXi,
    bench,
    captain,
    viceCaptain,
    analysis: finalAnalysis,
    intelligence,
  };
});

function buildPlanningBanner(
  planningContext: PlanningGameweekContext,
  gameweek: DashboardData["gameweek"],
): PlanningBanner {
  const planningGw = planningContext.planningGameweek;
  const prepareHref = getPlanningPreparePath(planningGw.id);

  if (planningContext.currentState === "IN_PROGRESS" && planningContext.currentGameweek) {
    return {
      planningContext,
      prepareHref,
      headline: `GW${planningContext.currentGameweek.id} LIVE`,
      subline: `Prepare for GW${planningGw.id}`,
    };
  }

  if (planningContext.planningState === "UPCOMING") {
    return {
      planningContext,
      prepareHref,
      headline: `GW${planningGw.id} UPCOMING`,
      subline: `Prepare for GW${planningGw.id}`,
    };
  }

  return {
    planningContext,
    prepareHref,
    headline: `Gameweek ${gameweek.relevant.id}`,
    subline: `Prepare for GW${planningGw.id}`,
  };
}

export const getAuthenticatedDashboardData = cache(
  async function getAuthenticatedDashboardData(): Promise<DashboardPayload> {
    const entryId = await getAuthenticatedFplEntryId();
    return getDashboardData(entryId);
  },
);
