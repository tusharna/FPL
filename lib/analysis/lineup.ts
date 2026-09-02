import { compareByOverallScore } from "./score";
import type { PlayerAnalysis } from "./types";

export type FormationShape = {
  label: string;
  defenders: number;
  midfielders: number;
  forwards: number;
};

export const LEGAL_FORMATIONS: FormationShape[] = [
  { label: "3-4-3", defenders: 3, midfielders: 4, forwards: 3 },
  { label: "3-5-2", defenders: 3, midfielders: 5, forwards: 2 },
  { label: "4-3-3", defenders: 4, midfielders: 3, forwards: 3 },
  { label: "4-4-2", defenders: 4, midfielders: 4, forwards: 2 },
  { label: "4-5-1", defenders: 4, midfielders: 5, forwards: 1 },
  { label: "5-3-2", defenders: 5, midfielders: 3, forwards: 2 },
  { label: "5-4-1", defenders: 5, midfielders: 4, forwards: 1 },
  { label: "5-2-3", defenders: 5, midfielders: 2, forwards: 3 },
];

export function isLegalFormationCounts(
  defenders: number,
  midfielders: number,
  forwards: number,
  goalkeepers = 1,
): boolean {
  if (goalkeepers !== 1) {
    return false;
  }
  if (defenders + midfielders + forwards + goalkeepers !== 11) {
    return false;
  }
  if (defenders < 3 || defenders > 5) {
    return false;
  }
  if (midfielders < 2 || midfielders > 5) {
    return false;
  }
  if (forwards < 1 || forwards > 3) {
    return false;
  }
  return LEGAL_FORMATIONS.some(
    (formation) =>
      formation.defenders === defenders &&
      formation.midfielders === midfielders &&
      formation.forwards === forwards,
  );
}

export function pickPlayersForFormation(
  squad: PlayerAnalysis[],
  formation: FormationShape,
): PlayerAnalysis[] | null {
  const goalkeepers = squad
    .filter((player) => player.position === "GK")
    .sort(compareByOverallScore)
    .slice(0, 1);
  const defenders = squad
    .filter((player) => player.position === "DEF")
    .sort(compareByOverallScore)
    .slice(0, formation.defenders);
  const midfielders = squad
    .filter((player) => player.position === "MID")
    .sort(compareByOverallScore)
    .slice(0, formation.midfielders);
  const forwards = squad
    .filter((player) => player.position === "FWD")
    .sort(compareByOverallScore)
    .slice(0, formation.forwards);

  if (
    goalkeepers.length !== 1 ||
    defenders.length !== formation.defenders ||
    midfielders.length !== formation.midfielders ||
    forwards.length !== formation.forwards
  ) {
    return null;
  }

  return [...goalkeepers, ...defenders, ...midfielders, ...forwards];
}

export function formationScore(xi: PlayerAnalysis[]): number {
  return Number(xi.reduce((sum, player) => sum + player.overallScore, 0).toFixed(4));
}

export function selectBestXi(squad: PlayerAnalysis[]): {
  formation: FormationShape;
  xi: PlayerAnalysis[];
  score: number;
} {
  let best: { formation: FormationShape; xi: PlayerAnalysis[]; score: number } | null =
    null;

  for (const formation of LEGAL_FORMATIONS) {
    const xi = pickPlayersForFormation(squad, formation);
    if (!xi) {
      continue;
    }
    const score = formationScore(xi);
    if (!best || score > best.score) {
      best = { formation, xi, score };
    }
  }

  if (!best) {
    throw new Error("Unable to select a legal starting XI from the squad.");
  }

  return best;
}

export function compareLineups(
  currentStartingIds: number[],
  recommendedXi: PlayerAnalysis[],
  squadById: Map<number, PlayerAnalysis>,
): { playerIn: PlayerAnalysis; playerOut: PlayerAnalysis }[] {
  const recommendedIds = new Set(recommendedXi.map((player) => player.playerId));
  const currentSet = new Set(currentStartingIds);

  const outgoing = currentStartingIds
    .filter((id) => !recommendedIds.has(id))
    .map((id) => squadById.get(id))
    .filter((player): player is PlayerAnalysis => player != null);

  const incoming = recommendedXi.filter((player) => !currentSet.has(player.playerId));

  const usedIncoming = new Set<number>();
  const changes: { playerIn: PlayerAnalysis; playerOut: PlayerAnalysis }[] = [];

  for (const playerOut of outgoing) {
    const match = incoming.find(
      (playerIn) =>
        playerIn.position === playerOut.position && !usedIncoming.has(playerIn.playerId),
    );
    if (match) {
      usedIncoming.add(match.playerId);
      changes.push({ playerIn: match, playerOut });
    }
  }

  const remainingOut = outgoing.filter(
    (player) => !changes.some((change) => change.playerOut.playerId === player.playerId),
  );
  const remainingIn = incoming.filter((player) => !usedIncoming.has(player.playerId));

  remainingOut.forEach((playerOut, index) => {
    const playerIn = remainingIn[index];
    if (playerIn) {
      changes.push({ playerIn, playerOut });
    }
  });

  return changes;
}
