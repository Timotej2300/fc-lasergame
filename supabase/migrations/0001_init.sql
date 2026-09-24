create extension if not exists "uuid-ossp";

create type payment_status as enum (
  'PENDING','PAID_ONLINE','PAID_CASH','REFUNDED','REFUNDED_CASH','FAILED','FORFEITED','TO_REFUND','WAITING_CASH'
);

create type group_status as enum (
  'PENDING_PAYMENT','CONFIRMED','WAITING','CALLED','READY','COUNTDOWN','PLAYING','FINISHED','SKIPPED','CANCELLED','NO_SHOW'
);

create type booking_mode as enum ('SOLO','TEAMS');

create type slot_status as enum ('AVAILABLE','RESERVED','UNAVAILABLE','IN_PROGRESS','COMPLETED');

create table events (
  id uuid primary key default uuid_generate_v4(),
  name text not null default 'LaserGame FaceClub',
  event_date date not null,
  start_time time not null,
  end_time time not null,
  game_duration_minutes int not null default 10,
  break_duration_minutes int not null default 5,
  min_players int not null default 2,
  max_players int not null default 8,
  countdown_seconds int not null default 5,
  countdown_enabled boolean not null default true,
  deposit_amount_cents int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_event_times check (end_time > start_time),
  constraint chk_players check (max_players >= min_players and min_players >= 1)
);

create unique index one_active_event on events (is_active) where is_active = true;

create table game_slots (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references events(id) on delete cascade,
  slot_index int not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status slot_status not null default 'AVAILABLE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, slot_index),
  unique (event_id, start_time)
);

create index idx_game_slots_event on game_slots(event_id);

create table groups (
  id uuid primary key default uuid_generate_v4(),
  group_number int not null,
  event_id uuid not null references events(id) on delete cascade,
  slot_id uuid references game_slots(id) on delete set null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  mode booking_mode not null default 'SOLO',
  status group_status not null default 'PENDING_PAYMENT',
  source text not null default 'ONLINE',
  player_count int not null default 0,
  arrived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, group_number)
);

create index idx_groups_event on groups(event_id);
create index idx_groups_slot on groups(slot_id);
create unique index one_group_per_slot on groups(slot_id) where slot_id is not null and status not in ('CANCELLED','NO_SHOW');

create table teams (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references groups(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index idx_teams_group on teams(group_id);

create table players (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references groups(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index idx_players_group on players(group_id);

create table team_members (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (team_id, player_id)
);

create table payments (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references groups(id) on delete cascade,
  amount_cents int not null default 100,
  status payment_status not null default 'PENDING',
  method text not null default 'ONLINE',
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  refunded_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payments_group on payments(group_id);
create unique index uq_payment_intent on payments(stripe_payment_intent_id) where stripe_payment_intent_id is not null;

create table game_sessions (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references events(id) on delete cascade,
  group_id uuid references groups(id) on delete set null,
  slot_id uuid references game_slots(id) on delete set null,
  state text not null default 'WAITING',
  countdown_started_at timestamptz,
  game_started_at timestamptz,
  game_ends_at timestamptz,
  finished_at timestamptz,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index one_current_session on game_sessions(event_id) where is_current = true;
create index idx_sessions_event on game_sessions(event_id);

create table settings (
  id int primary key default 1,
  rules_visible_on_board boolean not null default true,
  sound_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint singleton check (id = 1)
);

insert into settings (id) values (1);

create table rules (
  id int primary key default 1,
  content text not null default '1. Pred vstupom si nasaď vestu.\n2. Počúvaj pokyny organizátora.\n3. Nestrieľaj mimo herného priestoru.\n4. Po skončení hry opusti ihrisko.',
  updated_at timestamptz not null default now(),
  constraint singleton check (id = 1)
);

insert into rules (id) values (1);

create table admins (
  id uuid primary key default uuid_generate_v4(),
  label text not null default 'admin',
  code_hash text not null,
  created_at timestamptz not null default now()
);

create table admin_sessions (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references admins(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index idx_admin_sessions_token on admin_sessions(token_hash);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_events_updated before update on events for each row execute function set_updated_at();
create trigger trg_slots_updated before update on game_slots for each row execute function set_updated_at();
create trigger trg_groups_updated before update on groups for each row execute function set_updated_at();
create trigger trg_payments_updated before update on payments for each row execute function set_updated_at();
create trigger trg_sessions_updated before update on game_sessions for each row execute function set_updated_at();
