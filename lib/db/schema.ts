import type { AIReport } from "@/lib/ai/types";

export const TABLES = {
  managers: "managers",
  gameweeks: "gameweeks",
  playersSnapshot: "players_snapshot",
  teamSnapshots: "team_snapshots",
  recommendations: "recommendations",
  recommendationPlayers: "recommendation_players",
  actualResults: "actual_results",
  reports: "reports",
} as const;

export type ManagerRow = {
  id: number;
  entry_id: number;
  name: string | null;
  created_at: string;
  updated_at: string;
};

export type GameweekRow = {
  id: number;
  name: string | null;
  deadline_time: string | null;
  finished: boolean;
  data_updated_at: string | null;
  created_at: string;
};

export type PlayerSnapshotRow = {
  id: number;
  gameweek_id: number;
  name: string;
  position: string;
  team_id: number | null;
  price: number | null;
  form: number | null;
  total_points: number | null;
  points_per_game: number | null;
  expected_goals: number | null;
  expected_assists: number | null;
  expected_goal_involvement: number | null;
  minutes: number | null;
  starts: number | null;
  ownership: number | null;
  chance_of_playing: number | null;
  news: string | null;
  created_at: string;
};

export type TeamSnapshotRow = {
  id: number;
  entry_id: number;
  gameweek_id: number;
  player_id: number;
  squad_position: number;
  is_starting: boolean;
  is_captain: boolean;
  is_vice_captain: boolean;
  multiplier: number;
  purchase_price: number | null;
  selling_price: number | null;
  created_at: string;
};

export type RecommendationRow = {
  id: number;
  entry_id: number;
  gameweek_id: number;
  current_formation: string | null;
  recommended_formation: string | null;
  captain_player_id: number | null;
  vice_captain_player_id: number | null;
  transfer_action: "SAVE" | "TRANSFER";
  transfer_out_player_id: number | null;
  transfer_in_player_id: number | null;
  engine_version: string | null;
  generated_at: string;
};

export type RecommendationPlayerRow = {
  id: number;
  recommendation_id: number;
  player_id: number;
  squad_position: number | null;
  is_starting: boolean;
  bench_order: number | null;
  overall_score: number | null;
  fixture_score: number | null;
  expected_points: number | null;
  created_at: string;
};

export type ActualResultRow = {
  id: number;
  gameweek_id: number;
  player_id: number;
  minutes: number | null;
  goals: number | null;
  assists: number | null;
  clean_sheets: number | null;
  bonus: number | null;
  points: number | null;
  created_at: string;
};

export type ReportRow = {
  id: number;
  recommendation_id: number;
  title: string | null;
  report_json: AIReport;
  provider: string | null;
  model: string | null;
  generated_at: string;
};
