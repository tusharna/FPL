-- Phase 6: Notifications, scheduled reports & deadline alerts

create table if not exists notification_preferences (
  id bigint generated always as identity primary key,
  entry_id bigint unique not null,

  email_enabled boolean default true,
  sms_enabled boolean default false,

  gameweek_reports boolean default true,
  deadline_reminders boolean default true,
  captain_alerts boolean default true,
  lineup_alerts boolean default true,
  transfer_alerts boolean default true,
  availability_alerts boolean default true,
  fixture_alerts boolean default true,
  price_alerts boolean default false,

  minimum_severity text default 'IMPORTANT',

  quiet_hours_enabled boolean default false,
  quiet_hours_start time,
  quiet_hours_end time,

  email_destination text,
  sms_destination text,

  updated_at timestamptz default now()
);

create table if not exists notification_events (
  id bigint generated always as identity primary key,

  entry_id bigint not null,
  gameweek_id bigint,

  type text not null,
  severity text not null,

  title text not null,
  message text not null,

  player_id bigint,

  action_required boolean default false,

  dedupe_key text unique not null,

  created_at timestamptz default now(),
  expires_at timestamptz,
  read_at timestamptz
);

create table if not exists notification_deliveries (
  id bigint generated always as identity primary key,

  notification_id bigint not null references notification_events(id) on delete cascade,

  channel text not null,
  destination text,

  status text not null,

  provider_message_id text,

  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,

  error_message text
);

create table if not exists notification_state (
  id bigint generated always as identity primary key,

  entry_id bigint not null,
  gameweek_id bigint not null,

  state_json jsonb not null,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(entry_id, gameweek_id)
);

create index if not exists idx_notification_events_entry on notification_events (entry_id);
create index if not exists idx_notification_events_gw on notification_events (gameweek_id);
create index if not exists idx_notification_events_created on notification_events (created_at desc);
create index if not exists idx_notification_deliveries_notification on notification_deliveries (notification_id);
create index if not exists idx_notification_state_entry_gw on notification_state (entry_id, gameweek_id);
