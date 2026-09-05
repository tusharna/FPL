-- Auth profiles and row-level security for user-scoped data

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  fpl_entry_id bigint,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_fpl_entry_id on profiles (fpl_entry_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create or replace function public.current_user_fpl_entry_id()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select fpl_entry_id
  from public.profiles
  where id = auth.uid()
$$;

-- User-scoped tables (entry_id maps to profiles.fpl_entry_id)
alter table managers enable row level security;
alter table team_snapshots enable row level security;
alter table recommendations enable row level security;
alter table recommendation_players enable row level security;
alter table reports enable row level security;
alter table notification_preferences enable row level security;
alter table notification_events enable row level security;
alter table notification_deliveries enable row level security;
alter table notification_state enable row level security;

create policy "Users access own manager row"
  on managers for all
  using (entry_id = public.current_user_fpl_entry_id())
  with check (entry_id = public.current_user_fpl_entry_id());

create policy "Users access own team snapshots"
  on team_snapshots for all
  using (entry_id = public.current_user_fpl_entry_id())
  with check (entry_id = public.current_user_fpl_entry_id());

create policy "Users access own recommendations"
  on recommendations for all
  using (entry_id = public.current_user_fpl_entry_id())
  with check (entry_id = public.current_user_fpl_entry_id());

create policy "Users access own recommendation players"
  on recommendation_players for all
  using (
    recommendation_id in (
      select id from recommendations
      where entry_id = public.current_user_fpl_entry_id()
    )
  )
  with check (
    recommendation_id in (
      select id from recommendations
      where entry_id = public.current_user_fpl_entry_id()
    )
  );

create policy "Users access own reports"
  on reports for all
  using (
    recommendation_id in (
      select id from recommendations
      where entry_id = public.current_user_fpl_entry_id()
    )
  )
  with check (
    recommendation_id in (
      select id from recommendations
      where entry_id = public.current_user_fpl_entry_id()
    )
  );

create policy "Users access own notification preferences"
  on notification_preferences for all
  using (entry_id = public.current_user_fpl_entry_id())
  with check (entry_id = public.current_user_fpl_entry_id());

create policy "Users access own notification events"
  on notification_events for all
  using (entry_id = public.current_user_fpl_entry_id())
  with check (entry_id = public.current_user_fpl_entry_id());

create policy "Users access own notification deliveries"
  on notification_deliveries for all
  using (
    notification_id in (
      select id from notification_events
      where entry_id = public.current_user_fpl_entry_id()
    )
  )
  with check (
    notification_id in (
      select id from notification_events
      where entry_id = public.current_user_fpl_entry_id()
    )
  );

create policy "Users access own notification state"
  on notification_state for all
  using (entry_id = public.current_user_fpl_entry_id())
  with check (entry_id = public.current_user_fpl_entry_id());

-- Shared FPL reference data remains readable to authenticated users.
alter table gameweeks enable row level security;
alter table players_snapshot enable row level security;
alter table actual_results enable row level security;
alter table intelligence_events enable row level security;
alter table price_snapshots enable row level security;
alter table fixture_changes enable row level security;
alter table news_items enable row level security;

create policy "Authenticated users can read gameweeks"
  on gameweeks for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read player snapshots"
  on players_snapshot for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read actual results"
  on actual_results for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read intelligence events"
  on intelligence_events for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read price snapshots"
  on price_snapshots for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read fixture changes"
  on fixture_changes for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read news items"
  on news_items for select
  using (auth.role() = 'authenticated');
