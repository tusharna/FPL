import type { FplEvent } from "./types";

export type GameweekState = "FINISHED" | "IN_PROGRESS" | "UPCOMING";

export type PlanningGameweekContext = {
  planningGameweek: FplEvent;
  currentGameweek: FplEvent | null;
  planningState: GameweekState;
  currentState: GameweekState | null;
};

export function getGameweekState(event: FplEvent): GameweekState {
  if (event.finished) {
    return "FINISHED";
  }
  if (event.is_current) {
    return "IN_PROGRESS";
  }
  return "UPCOMING";
}

function findNextUpcoming(
  events: FplEvent[],
  afterId?: number,
): FplEvent | null {
  const candidates = events
    .filter((event) => !event.finished && (afterId == null || event.id > afterId))
    .sort((a, b) => a.id - b.id);
  return candidates[0] ?? null;
}

/**
 * Resolves which gameweek the user should plan for.
 *
 * - IN_PROGRESS current GW → plan for next upcoming GW
 * - UPCOMING relevant GW → plan for that GW
 * - FINISHED relevant GW → plan for next upcoming GW
 */
export function getPlanningGameweek(
  events: FplEvent[],
): PlanningGameweekContext | null {
  const current = events.find((event) => event.is_current) ?? null;
  const next = events.find((event) => event.is_next) ?? null;

  if (current && !current.finished) {
    const planning = next ?? findNextUpcoming(events, current.id);
    if (!planning) {
      return null;
    }
    return {
      planningGameweek: planning,
      currentGameweek: current,
      planningState: getGameweekState(planning),
      currentState: "IN_PROGRESS",
    };
  }

  if (next && !next.finished) {
    return {
      planningGameweek: next,
      currentGameweek: current,
      planningState: getGameweekState(next),
      currentState: current ? getGameweekState(current) : null,
    };
  }

  const upcoming = findNextUpcoming(events);
  if (!upcoming) {
    return null;
  }

  return {
    planningGameweek: upcoming,
    currentGameweek: current,
    planningState: getGameweekState(upcoming),
    currentState: current ? getGameweekState(current) : null,
  };
}

export function isValidPlanningTarget(
  events: FplEvent[],
  gameweekId: number,
): boolean {
  const planning = getPlanningGameweek(events);
  return planning?.planningGameweek.id === gameweekId;
}

export function getPlanningPreparePath(gameweekId: number): string {
  return `/gameweeks/${gameweekId}/prepare`;
}
