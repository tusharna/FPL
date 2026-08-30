import type { FplEvent, GameweekInfo } from "./types";

export function detectGameweek(events: FplEvent[]): GameweekInfo {
  const current = events.find((event) => event.is_current) ?? null;
  const next = events.find((event) => event.is_next) ?? null;
  const relevant = current ?? next ?? events.find((event) => !event.finished) ?? null;

  if (!relevant) {
    throw new Error("Unable to determine the current Gameweek from FPL events.");
  }

  return {
    current,
    next,
    relevant,
    deadline: relevant.deadline_time,
    isFinished: relevant.finished,
  };
}
