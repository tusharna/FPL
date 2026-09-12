import { cache } from "react";
import { analyzeGameweek } from "@/lib/analysis/team";
import type { GameweekAnalysis } from "@/lib/analysis/types";
import { getAuthenticatedFplEntryId } from "@/lib/auth/user";
import { runIntelligencePipeline } from "@/lib/intelligence";
import type { IntelligenceBundle } from "@/lib/intelligence/types";
import { FplAuthError, FplAuthNotConfiguredError } from "./auth";
import { getBootstrapStatic } from "./bootstrap";
import { getEntry } from "./entry";
import { getFixtures } from "./fixtures";
import { detectGameweek } from "./gameweek";
import {
  getPlanningGameweek,
  type PlanningGameweekContext,
} from "./gameweek-state";
import { MyTeamUnavailableError, getMyTeam, normalizeMyTeamSquad } from "./my-team";
import { indexById, normalizePlayer } from "./normalize";
import type { FplEvent, ManagerInfo, SquadPlayer } from "./types";

export type NextGameweekPlanningData = {
  entryId: number;
  planningContext: PlanningGameweekContext;
  currentGameweek: GameweekInfoSubset;
  planningGameweek: GameweekInfoSubset;
  manager: ManagerInfo;
  squad: SquadPlayer[];
  startingXi: SquadPlayer[];
  bench: SquadPlayer[];
  captain: SquadPlayer | null;
  viceCaptain: SquadPlayer | null;
  bank: number;
  teamValue: number;
  analysis: GameweekAnalysis;
  intelligence: IntelligenceBundle;
  generatedAt: string;
};

export type GameweekInfoSubset = {
  id: number;
  name: string;
  deadline: string | null;
  finished: boolean;
};

export type PlanningDataResult =
  | { ok: true; data: NextGameweekPlanningData }
  | {
      ok: false;
      error:
        | "AUTH_NOT_CONFIGURED"
        | "AUTH_EXPIRED"
        | "MY_TEAM_UNAVAILABLE"
        | "NO_PLANNING_GW";
      message: string;
    };

function toGameweekInfo(event: FplEvent): GameweekInfoSubset {
  return {
    id: event.id,
    name: event.name,
    deadline: event.deadline_time,
    finished: event.finished,
  };
}

export const getNextGameweekPlanningData = cache(
  async function getNextGameweekPlanningData(
    entryId: number,
    planningGameweekId?: number,
  ): Promise<PlanningDataResult> {
    const [bootstrap, fixtures, entry] = await Promise.all([
      getBootstrapStatic(),
      getFixtures(),
      getEntry(entryId),
    ]);

    const gameweek = detectGameweek(bootstrap.events);
    const planningContext = getPlanningGameweek(bootstrap.events);

    if (!planningContext) {
      return {
        ok: false,
        error: "NO_PLANNING_GW",
        message: "No upcoming gameweek is available for planning.",
      };
    }

    if (
      planningGameweekId != null &&
      planningGameweekId !== planningContext.planningGameweek.id
    ) {
      return {
        ok: false,
        error: "NO_PLANNING_GW",
        message: `Gameweek ${planningGameweekId} is not the current planning target.`,
      };
    }

    const planningGwId = planningContext.planningGameweek.id;

    let myTeam;
    try {
      myTeam = await getMyTeam(entryId);
    } catch (error) {
      if (error instanceof FplAuthNotConfiguredError) {
        return {
          ok: false,
          error: "AUTH_NOT_CONFIGURED",
          message:
            "FPL API authentication is not configured. Set FPL_REFRESH_TOKEN in server environment to load your current squad.",
        };
      }
      if (error instanceof FplAuthError) {
        return {
          ok: false,
          error: "AUTH_EXPIRED",
          message:
            "Your FPL refresh token has expired or was revoked. Copy a fresh refresh_token from fantasy.premierleague.com, update FPL_REFRESH_TOKEN in .env.local, then restart the dev server.",
        };
      }
      if (error instanceof MyTeamUnavailableError) {
        return {
          ok: false,
          error: "MY_TEAM_UNAVAILABLE",
          message: error.message,
        };
      }
      return {
        ok: false,
        error: "MY_TEAM_UNAVAILABLE",
        message: "Unable to load your current FPL squad. Please try again.",
      };
    }

    const normalized = normalizeMyTeamSquad({
      myTeam,
      bootstrap,
      fixtures,
      planningGameweekId: planningGwId,
    });

    const teamsById = indexById(bootstrap.teams);
    const typesById = indexById(bootstrap.element_types);
    const allPlayers = bootstrap.elements.map((element) =>
      normalizePlayer(element, teamsById, typesById),
    );

    const analysis = analyzeGameweek({
      gameweek: planningGwId,
      squad: normalized.squad,
      startingXiIds: normalized.startingXi.map((player) => player.id),
      bank: normalized.bank,
      allPlayers,
      fixtures,
      teams: bootstrap.teams,
    });

    const squadIds = new Set(normalized.squad.map((player) => player.id));
    const squadPlayers = allPlayers.filter((player) => squadIds.has(player.id));

    const intelligence = await runIntelligencePipeline({
      gameweekId: planningGwId,
      entryId,
      squad: squadPlayers,
      allPlayers,
      fixtures,
      teamsById,
      captainId: analysis.captain.player.playerId,
      viceCaptainId: analysis.viceCaptain.player.playerId,
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
            gameweek: planningGwId,
            squad: normalized.squad,
            startingXiIds: normalized.startingXi.map((player) => player.id),
            bank: normalized.bank,
            allPlayers,
            fixtures,
            teams: bootstrap.teams,
            intelligenceById,
          })
        : analysis;

    const manager: ManagerInfo = {
      teamName: entry.name,
      managerName: `${entry.player_first_name} ${entry.player_last_name}`.trim(),
      teamValue: normalized.teamValue,
      bank: normalized.bank,
      totalPoints: entry.summary_overall_points,
      overallRank: entry.summary_overall_rank,
      gameweekPoints: entry.summary_event_points,
    };

    return {
      ok: true,
      data: {
        entryId,
        planningContext,
        currentGameweek: gameweek.current
          ? toGameweekInfo(gameweek.current)
          : toGameweekInfo(gameweek.relevant),
        planningGameweek: toGameweekInfo(planningContext.planningGameweek),
        manager,
        squad: normalized.squad,
        startingXi: normalized.startingXi,
        bench: normalized.bench,
        captain: normalized.captain,
        viceCaptain: normalized.viceCaptain,
        bank: normalized.bank,
        teamValue: normalized.teamValue,
        analysis: finalAnalysis,
        intelligence,
        generatedAt: new Date().toISOString(),
      },
    };
  },
);

export const getAuthenticatedNextGameweekPlanningData = cache(
  async function getAuthenticatedNextGameweekPlanningData(
    planningGameweekId?: number,
  ): Promise<PlanningDataResult> {
    const entryId = await getAuthenticatedFplEntryId();
    return getNextGameweekPlanningData(entryId, planningGameweekId);
  },
);
