import { describe, expect, it } from "vitest";
import { MINIMUM_TRANSFER_GAIN } from "../lib/analysis/config";
import {
  isLegalTransfer,
  recommendTransfer,
  transferGain,
} from "../lib/analysis/transfers";
import { analysisPlayer, ownedPlayer, standardSquad } from "./helpers";

describe("transfer legality", () => {
  const squad = standardSquad();

  it("allows a same-position affordable replacement", () => {
    const result = isLegalTransfer({
      squad,
      playerOutId: 8,
      playerIn: ownedPlayer({ id: 80, position: "MID", teamId: 18, price: 7 }),
      bank: 2,
    });
    expect(result.legal).toBe(true);
  });

  it("rejects a position mismatch", () => {
    const result = isLegalTransfer({
      squad,
      playerOutId: 8,
      playerIn: ownedPlayer({ id: 80, position: "FWD", teamId: 18, price: 7 }),
      bank: 5,
    });
    expect(result.legal).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/Position/);
  });

  it("rejects a move that exceeds budget", () => {
    const result = isLegalTransfer({
      squad,
      playerOutId: 8,
      playerIn: ownedPlayer({ id: 80, position: "MID", teamId: 18, price: 12 }),
      bank: 0.5,
    });
    expect(result.legal).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/budget/);
  });

  it("rejects a fourth player from the same club", () => {
    const stacked = standardSquad().map((player) =>
      player.id <= 3 ? { ...player, teamId: 9 } : player,
    );
    const result = isLegalTransfer({
      squad: stacked,
      playerOutId: 15,
      playerIn: ownedPlayer({ id: 99, position: "FWD", teamId: 9, price: 6 }),
      bank: 2,
    });
    expect(result.legal).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/club/);
  });

  it("rejects already owned players", () => {
    const result = isLegalTransfer({
      squad,
      playerOutId: 8,
      playerIn: squad[9]!,
      bank: 5,
    });
    expect(result.legal).toBe(false);
  });
});

describe("SAVE vs TRANSFER", () => {
  it("saves when the gain is below the threshold", () => {
    const decision = recommendTransfer([
      {
        playerOut: analysisPlayer({ playerId: 8, position: "MID", transferScore: 0.5 }),
        playerIn: analysisPlayer({ playerId: 80, position: "MID", transferScore: 0.55 }),
        gain: 0.05,
        reasons: ["small"],
      },
    ]);
    expect(0.05).toBeLessThan(MINIMUM_TRANSFER_GAIN);
    expect(decision.action).toBe("SAVE");
    expect(decision.reasons[0]).toBe("SAVE TRANSFER");
  });

  it("recommends a transfer when the gain is meaningful", () => {
    const playerOut = analysisPlayer({ playerId: 8, position: "MID", transferScore: 0.4 });
    const playerIn = analysisPlayer({ playerId: 80, position: "MID", transferScore: 0.7 });
    const gain = transferGain(playerOut, playerIn);
    const decision = recommendTransfer([
      { playerOut, playerIn, gain, reasons: ["upgrade"] },
    ]);
    expect(gain).toBeGreaterThan(MINIMUM_TRANSFER_GAIN);
    expect(decision.action).toBe("TRANSFER");
    expect(decision.playerIn?.playerId).toBe(80);
  });
});
