import { fplGet } from "./client";
import type { FplEntry } from "./types";

const ENTRY_REVALIDATE_SECONDS = 120;

export async function getEntry(entryId: number): Promise<FplEntry> {
  return fplGet<FplEntry>(`/entry/${entryId}/`, {
    revalidateSeconds: ENTRY_REVALIDATE_SECONDS,
  });
}
