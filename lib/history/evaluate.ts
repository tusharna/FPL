import type {
  ActualResultRow,
  RecommendationPlayerRow,
  RecommendationRow,
  TeamSnapshotRow,
} from "@/lib/db/schema";

export type RecommendationEvaluation = {
  gameweek: number;
  actualTeamPoints: number;
  recommendedTeamPoints: number;
  actualCaptain: {
    player: string;
    points: number;
  };
  recommendedCaptain: {
    player: string;
    points: number;
  };
  captainDelta: number;
  benchPoints: number;
  lineupDelta: number;
  transfer: {
    action: "SAVE" | "TRANSFER";
    playerOut?: string;
    playerIn?: string;
    transferImpact?: number;
  };
  captainCorrect: boolean;
  transferPositive: boolean | null;
};

type EvaluateInput = {
  gameweekId: number;
  recommendation: RecommendationRow | null;
  recommendationPlayers: RecommendationPlayerRow[];
  teamSnapshot: TeamSnapshotRow[];
  actualResults: ActualResultRow[];
  playerNames: Record<number, string>;
  transferCost?: number;
};

function pointsForPlayer(
  playerId: number,
  actualResults: ActualResultRow[],
): number {
  return actualResults.find((row) => row.player_id === playerId)?.points ?? 0;
}

function effectiveCaptainPoints(
  captainId: number | null,
  viceCaptainId: number | null,
  actualResults: ActualResultRow[],
): number {
  if (captainId == null) {
    return 0;
  }

  const captainMinutes =
    actualResults.find((row) => row.player_id === captainId)?.minutes ?? 0;
  const captainPoints = pointsForPlayer(captainId, actualResults);

  if (captainMinutes > 0) {
    return captainPoints * 2;
  }

  if (viceCaptainId != null) {
    return pointsForPlayer(viceCaptainId, actualResults) * 2;
  }

  return 0;
}

function teamPointsFromSnapshot(
  snapshot: TeamSnapshotRow[],
  actualResults: ActualResultRow[],
  captainId: number | null,
  viceCaptainId: number | null,
): { startingPoints: number; benchPoints: number } {
  let startingPoints = 0;
  let benchPoints = 0;

  for (const row of snapshot) {
    const basePoints = pointsForPlayer(row.player_id, actualResults);
    if (!row.is_starting) {
      benchPoints += basePoints;
      continue;
    }

    if (row.is_captain) {
      const captainMinutes =
        actualResults.find((result) => result.player_id === row.player_id)
          ?.minutes ?? 0;
      if (captainMinutes > 0) {
        startingPoints += basePoints * 2;
        continue;
      }
      if (viceCaptainId != null) {
        continue;
      }
    }

    if (row.is_vice_captain && captainId != null) {
      const captainMinutes =
        actualResults.find((result) => result.player_id === captainId)?.minutes ??
        0;
      if (captainMinutes === 0) {
        startingPoints += basePoints * 2;
        continue;
      }
    }

    startingPoints += basePoints;
  }

  return { startingPoints, benchPoints };
}

function recommendedTeamPoints(
  recommendation: RecommendationRow,
  recommendationPlayers: RecommendationPlayerRow[],
  actualResults: ActualResultRow[],
): number {
  const starting = recommendationPlayers.filter((row) => row.is_starting);
  const captainId = recommendation.captain_player_id;
  const viceCaptainId = recommendation.vice_captain_player_id;
  const captainMinutes =
    captainId != null
      ? (actualResults.find((row) => row.player_id === captainId)?.minutes ?? 0)
      : 0;

  let total = 0;

  for (const row of starting) {
    const basePoints = pointsForPlayer(row.player_id, actualResults);

    if (row.player_id === captainId && captainMinutes > 0) {
      total += basePoints * 2;
      continue;
    }

    if (
      row.player_id === viceCaptainId &&
      captainId != null &&
      captainMinutes === 0
    ) {
      total += basePoints * 2;
      continue;
    }

    if (row.player_id === captainId) {
      continue;
    }

    total += basePoints;
  }

  return total;
}

export function evaluateRecommendation(
  input: EvaluateInput,
): RecommendationEvaluation | null {
  const {
    gameweekId,
    recommendation,
    recommendationPlayers,
    teamSnapshot,
    actualResults,
    playerNames,
    transferCost = 0,
  } = input;

  if (!recommendation || actualResults.length === 0 || teamSnapshot.length === 0) {
    return null;
  }

  const actualCaptainId =
    teamSnapshot.find((row) => row.is_captain)?.player_id ?? null;
  const actualViceCaptainId =
    teamSnapshot.find((row) => row.is_vice_captain)?.player_id ?? null;

  const actual = teamPointsFromSnapshot(
    teamSnapshot,
    actualResults,
    actualCaptainId,
    actualViceCaptainId,
  );
  const recommendedTeamPointsValue = recommendedTeamPoints(
    recommendation,
    recommendationPlayers,
    actualResults,
  );

  const actualCaptainPoints = effectiveCaptainPoints(
    actualCaptainId,
    actualViceCaptainId,
    actualResults,
  );
  const recommendedCaptainPoints = effectiveCaptainPoints(
    recommendation.captain_player_id,
    recommendation.vice_captain_player_id,
    actualResults,
  );

  const transfer: RecommendationEvaluation["transfer"] = {
    action: recommendation.transfer_action,
  };

  if (recommendation.transfer_action === "TRANSFER") {
    const playerOutId = recommendation.transfer_out_player_id;
    const playerInId = recommendation.transfer_in_player_id;
    if (playerOutId != null && playerInId != null) {
      transfer.playerOut = playerNames[playerOutId] ?? `Player ${playerOutId}`;
      transfer.playerIn = playerNames[playerInId] ?? `Player ${playerInId}`;
      transfer.transferImpact =
        pointsForPlayer(playerInId, actualResults) -
        pointsForPlayer(playerOutId, actualResults) -
        transferCost;
    }
  }

  const captainCorrect =
    recommendation.captain_player_id != null &&
    actualCaptainId === recommendation.captain_player_id;

  const transferPositive =
    transfer.transferImpact == null ? null : transfer.transferImpact > 0;

  return {
    gameweek: gameweekId,
    actualTeamPoints: actual.startingPoints,
    recommendedTeamPoints: recommendedTeamPointsValue,
    actualCaptain: {
      player:
        actualCaptainId != null
          ? (playerNames[actualCaptainId] ?? `Player ${actualCaptainId}`)
          : "Unknown",
      points: actualCaptainPoints,
    },
    recommendedCaptain: {
      player:
        recommendation.captain_player_id != null
          ? (playerNames[recommendation.captain_player_id] ??
            `Player ${recommendation.captain_player_id}`)
          : "Unknown",
      points: recommendedCaptainPoints,
    },
    captainDelta: recommendedCaptainPoints - actualCaptainPoints,
    benchPoints: actual.benchPoints,
    lineupDelta: recommendedTeamPointsValue - actual.startingPoints,
    transfer,
    captainCorrect,
    transferPositive,
  };
}
