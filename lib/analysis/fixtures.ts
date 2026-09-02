import type { FplFixture, FplTeam, Position } from "@/lib/fpl/types";

export type ScoredFixture = {
  eventId: number;
  opponentId: number;
  isHome: boolean;
  difficulty: number;
  score: number;
};

export function fdrToScore(fdr: number | undefined): number {
  const clamped = Math.min(5, Math.max(1, fdr ?? 3));
  return Number((1.2 - 0.2 * clamped).toFixed(4));
}

export function clampScore(value: number): number {
  return Number(Math.min(1, Math.max(0.2, value)).toFixed(4));
}

function strengthToPressure(value: number | undefined): number {
  if (value == null || !Number.isFinite(value)) {
    return 0.5;
  }
  return Math.min(1, Math.max(0, (value - 1000) / 400));
}

export function listUpcomingFixtures(
  teamId: number,
  fixtures: FplFixture[],
  fromEventId: number,
  horizon: number,
): FplFixture[] {
  return fixtures
    .filter(
      (fixture) =>
        !fixture.finished &&
        fixture.event != null &&
        fixture.event >= fromEventId &&
        (fixture.team_h === teamId || fixture.team_a === teamId),
    )
    .sort((a, b) => (a.event ?? 0) - (b.event ?? 0))
    .slice(0, Math.max(1, horizon));
}

export function scoreSingleFixture(
  teamId: number,
  position: Position,
  fixture: FplFixture,
  teamsById: Map<number, FplTeam>,
): ScoredFixture {
  const isHome = fixture.team_h === teamId;
  const opponentId = isHome ? fixture.team_a : fixture.team_h;
  const opponent = teamsById.get(opponentId);
  const difficulty = isHome
    ? (fixture.team_h_difficulty ?? 3)
    : (fixture.team_a_difficulty ?? 3);

  const fdrScore = fdrToScore(difficulty);
  const homeBoost = isHome ? 0.06 : -0.04;

  const opponentAttack = isHome
    ? opponent?.strength_attack_away
    : opponent?.strength_attack_home;
  const opponentDefence = isHome
    ? opponent?.strength_defence_away
    : opponent?.strength_defence_home;

  const attackPressure = strengthToPressure(opponentAttack);
  const defenceQuality = strengthToPressure(opponentDefence);

  const positional =
    position === "GK" || position === "DEF"
      ? 1 - attackPressure
      : 1 - defenceQuality;

  const combined = 0.5 * fdrScore + 0.32 * positional + 0.18 * (0.6 + homeBoost);
  return {
    eventId: fixture.event ?? 0,
    opponentId,
    isHome,
    difficulty,
    score: clampScore(combined),
  };
}

export function scoreFixturesForTeam(
  teamId: number,
  position: Position,
  fixtures: FplFixture[],
  teamsById: Map<number, FplTeam>,
  fromEventId: number,
  horizon: number,
): number {
  const upcoming = listUpcomingFixtures(teamId, fixtures, fromEventId, horizon);
  if (upcoming.length === 0) {
    return 0.6;
  }

  const total = upcoming.reduce(
    (sum, fixture) =>
      sum + scoreSingleFixture(teamId, position, fixture, teamsById).score,
    0,
  );
  return Number((total / upcoming.length).toFixed(4));
}

export function describeFixtureScore(score: number): string {
  if (score >= 0.9) {
    return "extremely favorable";
  }
  if (score >= 0.75) {
    return "favorable";
  }
  if (score >= 0.55) {
    return "neutral";
  }
  if (score >= 0.35) {
    return "difficult";
  }
  return "extremely difficult";
}
