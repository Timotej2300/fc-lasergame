create or replace function generate_slots_for_event(p_event_id uuid)
returns void as $$
declare
  v_event events%rowtype;
  v_cursor timestamptz;
  v_end timestamptz;
  v_index int := 0;
  v_step interval;
  v_game interval;
begin
  select * into v_event from events where id = p_event_id;
  if not found then
    raise exception 'Event not found';
  end if;

  delete from game_slots
  where event_id = p_event_id
    and id not in (select slot_id from groups where slot_id is not null and event_id = p_event_id);

  v_game := (v_event.game_duration_minutes || ' minutes')::interval;
  v_step := ((v_event.game_duration_minutes + v_event.break_duration_minutes) || ' minutes')::interval;
  v_cursor := (v_event.event_date + v_event.start_time)::timestamptz;
  v_end := (v_event.event_date + v_event.end_time)::timestamptz;

  select coalesce(max(slot_index), -1) + 1 into v_index from game_slots where event_id = p_event_id;

  while v_cursor + v_game <= v_end loop
    insert into game_slots (event_id, slot_index, start_time, end_time, status)
    values (p_event_id, v_index, v_cursor, v_cursor + v_game, 'AVAILABLE')
    on conflict (event_id, start_time) do nothing;
    v_cursor := v_cursor + v_step;
    v_index := v_index + 1;
  end loop;
end;
$$ language plpgsql security definer;

create or replace function reserve_slot(
  p_event_id uuid,
  p_slot_id uuid,
  p_group_number int,
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text,
  p_mode booking_mode,
  p_player_count int,
  p_source text
) returns uuid as $$
declare
  v_slot game_slots%rowtype;
  v_group_id uuid;
begin
  select * into v_slot from game_slots where id = p_slot_id and event_id = p_event_id for update;

  if not found then
    raise exception 'SLOT_NOT_FOUND';
  end if;

  if v_slot.status <> 'AVAILABLE' then
    raise exception 'SLOT_UNAVAILABLE';
  end if;

  if exists (
    select 1 from groups
    where slot_id = p_slot_id and status not in ('CANCELLED','NO_SHOW')
  ) then
    raise exception 'SLOT_UNAVAILABLE';
  end if;

  insert into groups (
    group_number, event_id, slot_id, contact_name, contact_email, contact_phone,
    mode, player_count, source, status
  ) values (
    p_group_number, p_event_id, p_slot_id, p_contact_name, p_contact_email, p_contact_phone,
    p_mode, p_player_count, p_source, 'PENDING_PAYMENT'
  ) returning id into v_group_id;

  update game_slots set status = 'RESERVED' where id = p_slot_id;

  return v_group_id;
exception
  when unique_violation then
    raise exception 'SLOT_UNAVAILABLE';
end;
$$ language plpgsql security definer;

create or replace function next_group_number(p_event_id uuid)
returns int as $$
declare
  v_max int;
begin
  select coalesce(max(group_number), 0) + 1 into v_max
  from groups where event_id = p_event_id
  for update;
  return v_max;
end;
$$ language plpgsql security definer;

create or replace function release_slot_on_cancel()
returns trigger as $$
begin
  if new.status in ('CANCELLED','NO_SHOW') and old.status not in ('CANCELLED','NO_SHOW') and new.slot_id is not null then
    update game_slots set status = 'AVAILABLE' where id = new.slot_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_release_slot after update on groups
for each row execute function release_slot_on_cancel();
