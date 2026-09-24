import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin/guard";
import { eventSchema } from "@/lib/validation";
import { createServiceClient } from "@/lib/supabase/server";
import { regenerateSlots } from "@/lib/data/events";
import { first } from "@/lib/supabase/safe";

export async function PATCH(req: Request, { params }: { params: { eventId: string } }) {
  const denied = await guardAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatná požiadavka." }, { status: 400 });
  }

  const parsed = eventSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatné údaje." }, { status: 400 });
  }

  const d = parsed.data;
  const supabase = createServiceClient();

  const update: Record<string, unknown> = {};
  if (d.name !== undefined) update.name = d.name;
  if (d.eventDate !== undefined) update.event_date = d.eventDate;
  if (d.startTime !== undefined) update.start_time = d.startTime;
  if (d.endTime !== undefined) update.end_time = d.endTime;
  if (d.gameDurationMinutes !== undefined) update.game_duration_minutes = d.gameDurationMinutes;
  if (d.breakDurationMinutes !== undefined) update.break_duration_minutes = d.breakDurationMinutes;
  if (d.minPlayers !== undefined) update.min_players = d.minPlayers;
  if (d.maxPlayers !== undefined) update.max_players = d.maxPlayers;
  if (d.countdownSeconds !== undefined) update.countdown_seconds = d.countdownSeconds;
  if (d.countdownEnabled !== undefined) update.countdown_enabled = d.countdownEnabled;
  if (d.depositAmountCents !== undefined) update.deposit_amount_cents = d.depositAmountCents;

  const { data: eventRows, error } = await supabase
    .from("events")
    .update(update)
    .eq("id", params.eventId)
    .select("*");

  const event = first(eventRows);

  if (error || !event) {
    return NextResponse.json({ error: "Event sa nepodarilo upraviť." }, { status: 500 });
  }

  const scheduleChanged =
    d.eventDate !== undefined ||
    d.startTime !== undefined ||
    d.endTime !== undefined ||
    d.gameDurationMinutes !== undefined ||
    d.breakDurationMinutes !== undefined;

  if (scheduleChanged) {
    await regenerateSlots(event.id);
  }

  return NextResponse.json({ event });
}

export async function DELETE(_req: Request, { params }: { params: { eventId: string } }) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const supabase = createServiceClient();
  const { error } = await supabase.from("events").delete().eq("id", params.eventId);

  if (error) {
    return NextResponse.json({ error: "Event sa nepodarilo zmazať." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
