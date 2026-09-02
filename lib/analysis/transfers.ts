import { MAX_PLAYERS_PER_CLUB, MINIMUM_TRANSFER_GAIN } from "./config";
import type { Player } from "@/lib/fpl/types";
import type { PlayerAnalysis, TransferCandidate, TransferRecommendation } from "./types";

export type TransferCheck = {
  legal: boolean;
  reasons: string[];
};

export function isLegalTransfer(input: {
  squad: Player[];
  playerOutId: number;
  playerIn: Player;
  bank: number;
}): TransferCheck {
  const reasons: string[] = [];
  const playerOut = input.squad.find((player) => player.id === input.playerOutId);

  if (!playerOut) {
    return { legal: false, reasons: ["Player out is not in the squad"] };
  }

  if (input.squad.length !== 15) {
    reasons.push("Squad must contain 15 players");
  }

  if (input.squad.some((player) => player.id === input.playerIn.id)) {
    reasons.push("Replacement is already owned");
  }

  if (playerOut.position !== input.playerIn.position) {
    reasons.push("Position must match");
  }

  if (input.bank + playerOut.price + 1e-9 < input.playerIn.price) {
    reasons.push("Move exceeds remaining budget");
  }

  const clubCounts = new Map<number, number>();
  for (const player of input.squad) {
    if (player.id === playerOut.id) {
      continue;
    }
    clubCounts.set(player.teamId, (clubCounts.get(player.teamId) ?? 0) + 1);
  }
  clubCounts.set(
    input.playerIn.teamId,
    (clubCounts.get(input.playerIn.teamId) ?? 0) + 1,
  );
  if ((clubCounts.get(input.playerIn.teamId) ?? 0) > MAX_PLAYERS_PER_CLUB) {
    reasons.push(`Would exceed ${MAX_PLAYERS_PER_CLUB} players from one club`);
  }

  const remaining = input.squad.filter((player) => player.id !== playerOut.id);
  const nextSquad = [...remaining, input.playerIn];
  if (nextSquad.length !== 15) {
    reasons.push("Swap must keep a 15-player squad");
  }

  return { legal: reasons.length === 0, reasons };
}

export function transferGain(
  playerOut: PlayerAnalysis,
  playerIn: PlayerAnalysis,
): number {
  return Number((playerIn.transferScore - playerOut.transferScore).toFixed(4));
}

export function candidateReasons(
  playerOut: PlayerAnalysis,
  playerIn: PlayerAnalysis,
  gain: number,
): string[] {
  return [
    `Gain ${gain.toFixed(2)} vs ${playerOut.webName}`,
    `Expected points ${playerIn.expectedPointsNext.toFixed(1)} vs ${playerOut.expectedPointsNext.toFixed(1)}`,
    `Medium-term fixtures ${playerIn.fixtureScoreMedium.toFixed(2)} vs ${playerOut.fixtureScoreMedium.toFixed(2)}`,
    `Minutes security ${playerIn.minutesSecurity.toFixed(2)} vs ${playerOut.minutesSecurity.toFixed(2)}`,
  ];
}

export function findTransferCandidates(input: {
  squad: Player[];
  squadAnalysis: PlayerAnalysis[];
  market: PlayerAnalysis[];
  playersById: Map<number, Player>;
  bank: number;
}): TransferCandidate[] {
  const squadById = new Map(input.squad.map((player) => [player.id, player]));
  const owned = new Set(input.squad.map((player) => player.id));
  const candidates: TransferCandidate[] = [];

  for (const playerOut of input.squadAnalysis) {
    if (!squadById.has(playerOut.playerId)) {
      continue;
    }

    for (const playerIn of input.market) {
      if (owned.has(playerIn.playerId) || playerIn.position !== playerOut.position) {
        continue;
      }
      const marketPlayer = input.playersById.get(playerIn.playerId);
      if (!marketPlayer) {
        continue;
      }

      const legality = isLegalTransfer({
        squad: input.squad,
        playerOutId: playerOut.playerId,
        playerIn: marketPlayer,
        bank: input.bank,
      });
      if (!legality.legal) {
        continue;
      }

      const gain = transferGain(playerOut, playerIn);
      if (gain <= 0) {
        continue;
      }

      candidates.push({
        playerOut,
        playerIn,
        gain,
        reasons: candidateReasons(playerOut, playerIn, gain),
      });
    }
  }

  return candidates.sort((left, right) => {
    if (right.gain !== left.gain) {
      return right.gain - left.gain;
    }
    return left.playerIn.playerId - right.playerIn.playerId;
  });
}

export function recommendTransfer(
  candidates: TransferCandidate[],
): TransferRecommendation {
  const best = candidates[0];
  if (!best || best.gain < MINIMUM_TRANSFER_GAIN) {
    return {
      action: "SAVE",
      reasons: [
        "SAVE TRANSFER",
        best
          ? `Best legal replacement only gains ${best.gain.toFixed(2)}, below the ${MINIMUM_TRANSFER_GAIN} threshold`
          : "No legal same-position replacement beats a current player",
      ],
    };
  }

  return {
    action: "TRANSFER",
    playerOut: best.playerOut,
    playerIn: best.playerIn,
    score: best.gain,
    reasons: [
      "TRANSFER",
      ...best.reasons,
      "This is a recommendation only — the engine never applies the move",
    ],
  };
}
