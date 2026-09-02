import { cache } from "react";
import { analyzeGameweek } from "@/lib/analysis/team";
import type { GameweekAnalysis } from "@/lib/analysis/types";
import { getBootstrapStatic } from "./bootstrap";
import { getEntryId } from "./client";
import { getEntry } from "./entry";
import { getFixtures } from "./fixtures";
import { detectGameweek } from "./gameweek";
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

export type DashboardPayload = DashboardData & {
  analysis: GameweekAnalysis;
};

export const getDashboardData = cache(async function getDashboardData(
  entryId = getEntryId(),
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

  return {
    entryId,
    gameweek,
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
    analysis,
  };
});
