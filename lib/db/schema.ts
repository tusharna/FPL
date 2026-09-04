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
  intelligenceEvents: "intelligence_events",
  priceSnapshots: "price_snapshots",
  fixtureChanges: "fixture_changes",
  newsItems: "news_items",
  notificationPreferences: "notification_preferences",
  notificationEvents: "notification_events",
  notificationDeliveries: "notification_deliveries",
  notificationState: "notification_state",
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

export type IntelligenceEventRow = {
  id: number;
  gameweek_id: number | null;
  player_id: number | null;
  type: string;
  risk: string | null;
  confidence: number | null;
  reason: string | null;
  source: string | null;
  source_url: string | null;
  detected_at: string;
};

export type PriceSnapshotRow = {
  id: number;
  player_id: number;
  price: number;
  captured_at: string;
};

export type FixtureChangeRow = {
  id: number;
  fixture_id: number;
  type: string;
  previous_value: string | null;
  new_value: string | null;
  detected_at: string;
};

export type NewsItemRow = {
  id: string;
  player_id: number | null;
  title: string;
  summary: string | null;
  source: string | null;
  source_url: string | null;
  published_at: string | null;
  relevance: string | null;
  confidence: number | null;
  created_at: string;
};

export type NotificationPreferencesRow = {
  id: number;
  entry_id: number;
  email_enabled: boolean;
  sms_enabled: boolean;
  gameweek_reports: boolean;
  deadline_reminders: boolean;
  captain_alerts: boolean;
  lineup_alerts: boolean;
  transfer_alerts: boolean;
  availability_alerts: boolean;
  fixture_alerts: boolean;
  price_alerts: boolean;
  minimum_severity: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  email_destination: string | null;
  sms_destination: string | null;
  updated_at: string;
};

export type NotificationEventRow = {
  id: number;
  entry_id: number;
  gameweek_id: number | null;
  type: string;
  severity: string;
  title: string;
  message: string;
  player_id: number | null;
  action_required: boolean;
  dedupe_key: string;
  created_at: string;
  expires_at: string | null;
  read_at: string | null;
};

export type NotificationDeliveryRow = {
  id: number;
  notification_id: number;
  channel: string;
  destination: string | null;
  status: string;
  provider_message_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  error_message: string | null;
};

export type NotificationStateRow = {
  id: number;
  entry_id: number;
  gameweek_id: number;
  state_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
