import type { Player } from "@/lib/fpl/types";
import type { PriceDirection, PriceSignal, PriceSnapshot } from "./types";

export function detectPriceSignals(
  players: Player[],
  previousSnapshots: PriceSnapshot[],
): PriceSignal[] {
  const previousById = new Map(
    previousSnapshots.map((snapshot) => [snapshot.playerId, snapshot]),
  );

  return players.map((player) => {
    const previous = previousById.get(player.id);
    const direction = priceDirection(player.price, previous?.price);
    const delta = previous ? Number((player.price - previous.price).toFixed(1)) : 0;

    return {
      playerId: player.id,
      direction,
      currentPrice: player.price,
      previousPrice: previous?.price,
      confidence: previous ? 0.95 : 0.5,
      reason:
        direction === "STABLE"
          ? "Price unchanged since last snapshot"
          : `${previous?.price?.toFixed(1) ?? "?"}m → ${player.price.toFixed(1)}m`,
    };
  });
}

function priceDirection(current: number, previous?: number): PriceDirection {
  if (previous == null || current === previous) {
    return "STABLE";
  }
  return current > previous ? "RISING" : "FALLING";
}

export function capturePriceSnapshots(players: Player[]): PriceSnapshot[] {
  const capturedAt = new Date().toISOString();
  return players.map((player) => ({
    playerId: player.id,
    price: player.price,
    capturedAt,
  }));
}

export function squadPriceSignals(
  squad: Player[],
  allSignals: PriceSignal[],
): PriceSignal[] {
  const squadIds = new Set(squad.map((player) => player.id));
  return allSignals.filter(
    (signal) => squadIds.has(signal.playerId) && signal.direction !== "STABLE",
  );
}
