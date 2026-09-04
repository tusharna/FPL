-- Phase 5: Live intelligence persistence

create table if not exists intelligence_events (
  id bigint generated always as identity primary key,
  gameweek_id bigint,
  player_id bigint,
  type text not null,
  risk text,
  confidence numeric,
  reason text,
  source text,
  source_url text,
  detected_at timestamptz default now()
);

create table if not exists price_snapshots (
  id bigint generated always as identity primary key,
  player_id bigint not null,
  price numeric not null,
  captured_at timestamptz default now()
);

create table if not exists fixture_changes (
  id bigint generated always as identity primary key,
  fixture_id bigint not null,
  type text not null,
  previous_value text,
  new_value text,
  detected_at timestamptz default now(),
  unique(fixture_id, type, new_value)
);

create table if not exists news_items (
  id text primary key,
  player_id bigint,
  title text not null,
  summary text,
  source text,
  source_url text,
  published_at timestamptz,
  relevance text,
  confidence numeric,
  created_at timestamptz default now()
);

create index if not exists idx_intelligence_events_gw on intelligence_events (gameweek_id);
create index if not exists idx_intelligence_events_player on intelligence_events (player_id);
create index if not exists idx_price_snapshots_player on price_snapshots (player_id);
create index if not exists idx_fixture_changes_fixture on fixture_changes (fixture_id);
create index if not exists idx_news_items_player on news_items (player_id);
