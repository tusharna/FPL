import type { FplFixture } from "@/lib/fpl/types";
import type { FixtureChange, FixtureChangeType, FixtureIntelligence } from "./types";

type FixtureSnapshot = {
  fixtureId: number;
  event: number | null;
  kickoffTime: string | null;
  finished: boolean;
  teamH: number;
  teamA: number;
};

const fixtureBaseline = new Map<number, FixtureSnapshot>();

function snapshotFixture(fixture: FplFixture): FixtureSnapshot {
  return {
    fixtureId: fixture.id,
    event: fixture.event,
    kickoffTime: fixture.kickoff_time,
    finished: fixture.finished,
    teamH: fixture.team_h,
    teamA: fixture.team_a,
  };
}

export function detectFixtureChanges(fixtures: FplFixture[]): FixtureChange[] {
  const detectedAt = new Date().toISOString();
  const changes: FixtureChange[] = [];

  const eventsByTeam = new Map<number, number[]>();
  for (const fixture of fixtures) {
    if (fixture.event == null) {
      continue;
    }
    for (const teamId of [fixture.team_h, fixture.team_a]) {
      const list = eventsByTeam.get(teamId) ?? [];
      list.push(fixture.event);
      eventsByTeam.set(teamId, list);
    }
  }

  for (const [teamId, events] of eventsByTeam) {
    const counts = new Map<number, number>();
    for (const event of events) {
      counts.set(event, (counts.get(event) ?? 0) + 1);
    }
    for (const [event, count] of counts) {
      if (count >= 2) {
        changes.push({
          fixtureId: teamId * 10_000 + event,
          type: "DOUBLE",
          newValue: `Team ${teamId} has a double Gameweek in GW${event}`,
          detectedAt,
        });
      }
    }
    const upcomingEvents = [...new Set(events)].sort((a, b) => a - b);
    if (upcomingEvents.length >= 2) {
      const gaps = upcomingEvents.slice(1).map((event, index) => event - upcomingEvents[index]!);
      if (gaps.some((gap) => gap > 1)) {
        changes.push({
          fixtureId: teamId * 10_000,
          type: "BLANK",
          newValue: `Team ${teamId} may have a blank Gameweek in the upcoming schedule`,
          detectedAt,
        });
      }
    }
  }

  for (const fixture of fixtures) {
    const previous = fixtureBaseline.get(fixture.id);
    const current = snapshotFixture(fixture);
    fixtureBaseline.set(fixture.id, current);

    if (!previous) {
      continue;
    }

    if (previous.kickoffTime !== current.kickoffTime && current.kickoffTime) {
      changes.push({
        fixtureId: fixture.id,
        type: "TIME_CHANGE",
        previousValue: previous.kickoffTime ?? "unknown",
        newValue: current.kickoffTime,
        detectedAt,
      });
    }

    if (!previous.finished && current.finished && !current.kickoffTime) {
      changes.push({
        fixtureId: fixture.id,
        type: "POSTPONED",
        previousValue: previous.kickoffTime ?? "scheduled",
        newValue: "postponed",
        detectedAt,
      });
    }

    if (previous.event !== current.event && current.event != null) {
      changes.push({
        fixtureId: fixture.id,
        type: "REARRANGED",
        previousValue: previous.event != null ? `GW${previous.event}` : "unknown",
        newValue: `GW${current.event}`,
        detectedAt,
      });
    }

    if (previous.teamH !== current.teamH || previous.teamA !== current.teamA) {
      changes.push({
        fixtureId: fixture.id,
        type: "REARRANGED",
        previousValue: `${previous.teamH} vs ${previous.teamA}`,
        newValue: `${current.teamH} vs ${current.teamA}`,
        detectedAt,
      });
    }
  }

  return dedupeFixtureChanges(changes);
}

function dedupeFixtureChanges(changes: FixtureChange[]): FixtureChange[] {
  const seen = new Set<string>();
  return changes.filter((change) => {
    const key = `${change.fixtureId}:${change.type}:${change.newValue}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function buildFixtureIntelligence(input: {
  playerId: number;
  teamId: number;
  fixtures: FplFixture[];
  teamsById: Map<number, { short_name: string }>;
  fromGameweek: number;
  fixtureChanges: FixtureChange[];
}): FixtureIntelligence {
  const nextFixtures = input.fixtures
    .filter(
      (fixture) =>
        fixture.event != null &&
        fixture.event >= input.fromGameweek &&
        (fixture.team_h === input.teamId || fixture.team_a === input.teamId),
    )
    .slice(0, 3)
    .map((fixture) => {
      const home = fixture.team_h === input.teamId;
      const opponentId = home ? fixture.team_a : fixture.team_h;
      return {
        gameweek: fixture.event ?? input.fromGameweek,
        opponent: input.teamsById.get(opponentId)?.short_name ?? "TBC",
        difficulty: home
          ? (fixture.team_a_difficulty ?? 3)
          : (fixture.team_h_difficulty ?? 3),
        home,
      };
    });

  const teamFixtureChanges = input.fixtureChanges.filter((change) =>
    change.newValue?.includes(String(input.teamId)),
  );
  const fixtureChangeRisk =
    teamFixtureChanges.some((change) => change.type === "POSTPONED")
      ? "HIGH"
      : teamFixtureChanges.length > 0
        ? "MEDIUM"
        : "LOW";

  return {
    playerId: input.playerId,
    nextFixtures,
    fixtureChangeRisk,
  };
}

export function seedFixtureBaseline(fixtures: FplFixture[]): void {
  for (const fixture of fixtures) {
    if (!fixtureBaseline.has(fixture.id)) {
      fixtureBaseline.set(fixture.id, snapshotFixture(fixture));
    }
  }
}

export function resetFixtureBaseline(): void {
  fixtureBaseline.clear();
}
