import { fplGet } from "./client";
import type { FplPicksResponse } from "./types";

const PICKS_REVALIDATE_SECONDS = 60;

export async function getPicks(
  entryId: number,
  gameweek: number,
): Promise<FplPicksResponse> {
  return fplGet<FplPicksResponse>(
    `/entry/${entryId}/event/${gameweek}/picks/`,
    { revalidateSeconds: PICKS_REVALIDATE_SECONDS },
  );
}
