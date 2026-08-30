export type Position = "GK" | "DEF" | "MID" | "FWD";

export type FplElementType = {
  id: number;
  singular_name: string;
  singular_name_short: string;
  element_count: number;
};

export type FplTeam = {
  id: number;
  name: string;
  short_name: string;
};

export type FplEvent = {
  id: number;
  name: string;
  deadline_time: string | null;
  finished: boolean;
  data_checked: boolean;
  is_previous: boolean;
  is_current: boolean;
  is_next: boolean;
};

export type FplElement = {
  id: number;
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  element_type: number;
  now_cost: number;
  form: string;
  total_points: number;
  points_per_game: string;
  event_points: number;
  ep_next: string | null;
  ep_this: string | null;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  minutes: number;
  starts: number;
  selected_by_percent: string;
  chance_of_playing_this_round: number | null;
  chance_of_playing_next_round: number | null;
  news: string;
};

export type FplBootstrapStatic = {
  events: FplEvent[];
  teams: FplTeam[];
  element_types: FplElementType[];
  elements: FplElement[];
};

export type FplEntry = {
  id: number;
  name: string;
  player_first_name: string;
  player_last_name: string;
  summary_overall_points: number;
  summary_overall_rank: number | null;
  summary_event_points: number;
  summary_event_rank: number | null;
  current_event: number | null;
  last_deadline_bank: number | null;
  last_deadline_value: number | null;
};

export type FplPick = {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  element_type?: number;
};

export type FplEntryHistory = {
  event: number;
  points: number;
  total_points: number;
  rank: number | null;
  overall_rank: number | null;
  bank: number;
  value: number;
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
};

export type FplPicksResponse = {
  active_chip: string | null;
  entry_history: FplEntryHistory;
  picks: FplPick[];
};

export type FplFixture = {
  id: number;
  event: number | null;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
  finished: boolean;
  kickoff_time: string | null;
};

export type Player = {
  id: number;
  name: string;
  webName: string;
  position: Position;
  teamId: number;
  teamName: string;
  teamShortName: string;
  price: number;
  form: number;
  totalPoints: number;
  pointsPerGame: number;
  eventPoints: number;
  expectedPointsNext: number;
  expectedGoals: number;
  expectedAssists: number;
  expectedGoalInvolvement: number;
  minutes: number;
  starts: number;
  ownership: number;
  chanceOfPlaying: number | null;
  news: string;
};

export type UpcomingFixture = {
  eventId: number;
  opponentShortName: string;
  isHome: boolean;
  kickoffTime: string | null;
};

export type SquadPlayer = Player & {
  squadPosition: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isStarting: boolean;
  multiplier: number;
  nextFixture: UpcomingFixture | null;
};

export type GameweekInfo = {
  current: FplEvent | null;
  next: FplEvent | null;
  relevant: FplEvent;
  deadline: string | null;
  isFinished: boolean;
};

export type ManagerInfo = {
  teamName: string;
  managerName: string;
  teamValue: number;
  bank: number;
  totalPoints: number;
  overallRank: number | null;
  gameweekPoints: number;
};

export type DashboardData = {
  entryId: number;
  gameweek: GameweekInfo;
  manager: ManagerInfo;
  squad: SquadPlayer[];
  startingXi: SquadPlayer[];
  bench: SquadPlayer[];
  captain: SquadPlayer | null;
  viceCaptain: SquadPlayer | null;
};
