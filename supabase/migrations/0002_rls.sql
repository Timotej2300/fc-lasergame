alter table events enable row level security;
alter table game_slots enable row level security;
alter table groups enable row level security;
alter table teams enable row level security;
alter table players enable row level security;
alter table team_members enable row level security;
alter table payments enable row level security;
alter table game_sessions enable row level security;
alter table settings enable row level security;
alter table rules enable row level security;
alter table admins enable row level security;
alter table admin_sessions enable row level security;

create policy "public read active events" on events for select using (true);
create policy "public read slots" on game_slots for select using (true);
create policy "public read groups" on groups for select using (true);
create policy "public read teams" on teams for select using (true);
create policy "public read players" on players for select using (true);
create policy "public read team_members" on team_members for select using (true);
create policy "public read sessions" on game_sessions for select using (true);
create policy "public read settings" on settings for select using (true);
create policy "public read rules" on rules for select using (true);

-- No public insert/update/delete policies are defined anywhere in this file.
-- All writes (creating groups, slots, payments, admin actions, session control)
-- go exclusively through server-side API routes using the service role key,
-- which bypasses RLS. Anonymous/publishable clients are read-only.

-- payments, admins and admin_sessions have no public read policy: they are
-- only ever accessed server-side with the service role key.
