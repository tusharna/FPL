import { fplGet } from "./client";

const LIVE_REVALIDATE_SECONDS = 60;

export type FplLiveElement = {
  id: number;
  stats: {
    minutes: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    bonus: number;
    total_points: number;
  };
};

export type FplLiveGameweek = {
  elements: FplLiveElement[];
};

export async function getLiveGameweek(
  gameweekId: number,
): Promise<FplLiveGameweek> {
  return fplGet<FplLiveGameweek>(`/event/${gameweekId}/live/`, {
    revalidateSeconds: LIVE_REVALIDATE_SECONDS,
  });
}
