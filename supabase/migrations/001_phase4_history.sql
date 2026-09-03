-- Phase 4: Gameweek history & recommendation tracking

create table if not exists managers (
  id bigint primary key,
  entry_id bigint unique not null,
  name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists gameweeks (
  id bigint primary key,
  name text,
  deadline_time timestamptz,
  finished boolean default false,
  data_updated_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists players_snapshot (
  id bigint not null,
  gameweek_id bigint not null,
  name text not null,
  position text not null,
  team_id bigint,
  price numeric,
  form numeric,
  total_points integer,
  points_per_game numeric,
  expected_goals numeric,
  expected_assists numeric,
  expected_goal_involvement numeric,
  minutes integer,
  starts integer,
  ownership numeric,
  chance_of_playing numeric,
  news text,
  created_at timestamptz default now(),
  primary key (id, gameweek_id)
);

create table if not exists team_snapshots (
  id bigint generated always as identity primary key,
  entry_id bigint not null,
  gameweek_id bigint not null,
  player_id bigint not null,
  squad_position integer not null,
  is_starting boolean not null,
  is_captain boolean default false,
  is_vice_captain boolean default false,
  multiplier integer default 1,
  purchase_price numeric,
  selling_price numeric,
  created_at timestamptz default now(),
  unique(entry_id, gameweek_id, player_id)
);

create table if not exists recommendations (
  id bigint generated always as identity primary key,
  entry_id bigint not null,
  gameweek_id bigint not null,
  current_formation text,
  recommended_formation text,
  captain_player_id bigint,
  vice_captain_player_id bigint,
  transfer_action text not null,
  transfer_out_player_id bigint,
  transfer_in_player_id bigint,
  engine_version text,
  generated_at timestamptz default now(),
  unique(entry_id, gameweek_id)
);

create table if not exists recommendation_players (
  id bigint generated always as identity primary key,
  recommendation_id bigint not null,
  player_id bigint not null,
  squad_position integer,
  is_starting boolean not null,
  bench_order integer,
  overall_score numeric,
  fixture_score numeric,
  expected_points numeric,
  created_at timestamptz default now()
);

create table if not exists actual_results (
  id bigint generated always as identity primary key,
  gameweek_id bigint not null,
  player_id bigint not null,
  minutes integer,
  goals integer,
  assists integer,
  clean_sheets integer,
  bonus integer,
  points integer,
  created_at timestamptz default now(),
  unique(gameweek_id, player_id)
);

create table if not exists reports (
  id bigint generated always as identity primary key,
  recommendation_id bigint not null,
  title text,
  report_json jsonb not null,
  provider text,
  model text,
  generated_at timestamptz default now()
);

create index if not exists idx_team_snapshots_entry_gw on team_snapshots (entry_id, gameweek_id);
create index if not exists idx_team_snapshots_player on team_snapshots (player_id);
create index if not exists idx_players_snapshot_gw on players_snapshot (gameweek_id);
create index if not exists idx_recommendations_entry_gw on recommendations (entry_id, gameweek_id);
create index if not exists idx_recommendation_players_rec on recommendation_players (recommendation_id);
create index if not exists idx_actual_results_gw on actual_results (gameweek_id);
create index if not exists idx_reports_recommendation on reports (recommendation_id);
