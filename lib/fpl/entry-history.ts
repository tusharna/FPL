import { z } from "zod";
import { computeFreeTransfers, type PlayedChip } from "./chips";
import { fplGet } from "./client";

const ENTRY_HISTORY_REVALIDATE_SECONDS = 120;

const gameweekSchema = z.object({
  event: z.number().int(),
  event_transfers: z.number().int().optional().default(0),
});

const entryHistorySchema = z.object({
  current: z.array(gameweekSchema).optional().default([]),
  past: z.array(gameweekSchema).optional().default([]),
  chips: z
    .array(
      z.object({
        name: z.string(),
        event: z.number().int(),
      }),
    )
    .optional()
    .default([]),
});

export type EntryHistorySummary = {
  freeTransfers: number;
  chipsPlayed: PlayedChip[];
};

export async function getEntryHistory(entryId: number): Promise<EntryHistorySummary> {
  const raw = await fplGet<unknown>(`/entry/${entryId}/history/`, {
    revalidateSeconds: ENTRY_HISTORY_REVALIDATE_SECONDS,
  });
  const parsed = entryHistorySchema.parse(raw);
  const chipsPlayed = parsed.chips.map((chip) => ({
    name: chip.name,
    event: chip.event,
  }));

  return {
    freeTransfers: computeFreeTransfers({
      gameweeks: [...parsed.past, ...parsed.current].map((gameweek) => ({
        event: gameweek.event,
        eventTransfers: gameweek.event_transfers,
      })),
      chips: chipsPlayed,
    }),
    chipsPlayed,
  };
}
