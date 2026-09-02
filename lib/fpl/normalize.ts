import type {
  FplElement,
  FplElementType,
  FplFixture,
  FplPick,
  FplTeam,
  Player,
  Position,
  SquadPlayer,
  UpcomingFixture,
} from "./types";

const POSITION_BY_TYPE: Record<number, Position> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

export function mapPosition(elementType: number): Position {
  return POSITION_BY_TYPE[elementType] ?? "MID";
}

export function isStartingXi(multiplier: number): boolean {
  return multiplier > 0;
}

export function isBench(multiplier: number): boolean {
  return multiplier === 0;
}

export function parseNumeric(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (!value) {
    return 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function tenthsToMillions(value: number | null | undefined): number {
  if (value == null) {
    return 0;
  }
  return value / 10;
}

export function normalizePlayer(
  element: FplElement,
  teamsById: Map<number, FplTeam>,
  typesById: Map<number, FplElementType>,
): Player {
  const team = teamsById.get(element.team);
  const type = typesById.get(element.element_type);
  const short = type?.singular_name_short;
  const position: Position =
    short === "GKP" || short === "GK"
      ? "GK"
      : short === "DEF" || short === "MID" || short === "FWD"
        ? short
        : mapPosition(element.element_type);

  return {
    id: element.id,
    name: `${element.first_name} ${element.second_name}`.trim(),
    webName: element.web_name,
    position,
    teamId: element.team,
    teamName: team?.name ?? "Unknown",
    teamShortName: team?.short_name ?? "UNK",
    price: tenthsToMillions(element.now_cost),
    form: parseNumeric(element.form),
    totalPoints: element.total_points,
    pointsPerGame: parseNumeric(element.points_per_game),
    eventPoints: element.event_points,
    expectedPointsNext: parseNumeric(element.ep_next ?? element.ep_this),
    expectedGoals: parseNumeric(element.expected_goals),
    expectedAssists: parseNumeric(element.expected_assists),
    expectedGoalInvolvement: parseNumeric(element.expected_goal_involvements),
    minutes: element.minutes,
    starts: element.starts,
    ownership: parseNumeric(element.selected_by_percent),
    chanceOfPlaying: element.chance_of_playing_next_round,
    chanceOfPlayingThis: element.chance_of_playing_this_round,
    news: element.news ?? "",
    status: element.status ?? "a",
    penaltiesOrder: element.penalties_order ?? null,
  };
}

export function unknownPlayer(elementId: number, pick: FplPick): SquadPlayer {
  return {
    id: elementId,
    name: `Unknown Player (ID: ${elementId})`,
    webName: `Unknown (${elementId})`,
    position: pick.element_type ? mapPosition(pick.element_type) : "MID",
    teamId: 0,
    teamName: "Unknown",
    teamShortName: "UNK",
    price: 0,
    form: 0,
    totalPoints: 0,
    pointsPerGame: 0,
    eventPoints: 0,
    expectedPointsNext: 0,
    expectedGoals: 0,
    expectedAssists: 0,
    expectedGoalInvolvement: 0,
    minutes: 0,
    starts: 0,
    ownership: 0,
    chanceOfPlaying: null,
    chanceOfPlayingThis: null,
    news: "",
    status: "u",
    penaltiesOrder: null,
    squadPosition: pick.position,
    isCaptain: pick.is_captain,
    isViceCaptain: pick.is_vice_captain,
    isStarting: isStartingXi(pick.multiplier),
    multiplier: pick.multiplier,
    nextFixture: null,
  };
}

export function toSquadPlayer(player: Player, pick: FplPick): SquadPlayer {
  return {
    ...player,
    squadPosition: pick.position,
    isCaptain: pick.is_captain,
    isViceCaptain: pick.is_vice_captain,
    isStarting: isStartingXi(pick.multiplier),
    multiplier: pick.multiplier,
    nextFixture: null,
  };
}

export function mapPicksToSquad(
  picks: FplPick[],
  playersById: Map<number, Player>,
): SquadPlayer[] {
  return [...picks]
    .sort((a, b) => a.position - b.position)
    .map((pick) => {
      const player = playersById.get(pick.element);
      if (!player) {
        return unknownPlayer(pick.element, pick);
      }
      return toSquadPlayer(player, pick);
    });
}

export function classifySquad(squad: SquadPlayer[]): {
  startingXi: SquadPlayer[];
  bench: SquadPlayer[];
  captain: SquadPlayer | null;
  viceCaptain: SquadPlayer | null;
} {
  const startingXi = squad.filter((player) => isStartingXi(player.multiplier));
  const bench = squad.filter((player) => isBench(player.multiplier));
  const captain = squad.find((player) => player.isCaptain) ?? null;
  const viceCaptain = squad.find((player) => player.isViceCaptain) ?? null;

  return { startingXi, bench, captain, viceCaptain };
}

export function findNextFixture(
  teamId: number,
  fixtures: FplFixture[],
  teamsById: Map<number, FplTeam>,
  fromEventId: number,
): UpcomingFixture | null {
  const upcoming = fixtures
    .filter(
      (fixture) =>
        !fixture.finished &&
        fixture.event != null &&
        fixture.event >= fromEventId &&
        (fixture.team_h === teamId || fixture.team_a === teamId),
    )
    .sort((a, b) => (a.event ?? 0) - (b.event ?? 0));

  const fixture = upcoming[0];
  if (!fixture || fixture.event == null) {
    return null;
  }

  const isHome = fixture.team_h === teamId;
  const opponentId = isHome ? fixture.team_a : fixture.team_h;
  const opponent = teamsById.get(opponentId);

  return {
    eventId: fixture.event,
    opponentShortName: opponent?.short_name ?? "UNK",
    isHome,
    kickoffTime: fixture.kickoff_time,
  };
}

export function attachFixtures(
  squad: SquadPlayer[],
  fixtures: FplFixture[],
  teamsById: Map<number, FplTeam>,
  fromEventId: number,
): SquadPlayer[] {
  return squad.map((player) => ({
    ...player,
    nextFixture: findNextFixture(
      player.teamId,
      fixtures,
      teamsById,
      fromEventId,
    ),
  }));
}

export function indexById<T extends { id: number }>(items: T[]): Map<number, T> {
  return new Map(items.map((item) => [item.id, item]));
}
