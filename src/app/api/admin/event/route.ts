import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin/guard";
import { eventSchema } from "@/lib/validation";
import { createServiceClient } from "@/lib/supabase/server";
import { listEvents, regenerateSlots } from "@/lib/data/events";
import { first } from "@/lib/supabase/safe";

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;

  const events = await listEvents();
  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatná požiadavka." }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Neplatné údaje." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const d = parsed.data;

  const { data: existingActiveRows } = await supabase.from("events").select("id").eq("is_active", true).limit(1);
  const existingActive = first(existingActiveRows);
  if (existingActive) {
    await supabase.from("events").update({ is_active: false }).eq("id", existingActive.id);
  }

  const { data: eventRows, error } = await supabase
    .from("events")
    .insert({
      name: d.name,
      event_date: d.eventDate,
      start_time: d.startTime,
      end_time: d.endTime,
      game_duration_minutes: d.gameDurationMinutes,
      break_duration_minutes: d.breakDurationMinutes,
      min_players: d.minPlayers,
      max_players: d.maxPlayers,
      countdown_seconds: d.countdownSeconds,
      countdown_enabled: d.countdownEnabled,
      deposit_amount_cents: d.depositAmountCents,
      is_active: true
    })
    .select("*");

  const event = first(eventRows);

  if (error || !event) {
    return NextResponse.json({ error: "Event sa nepodarilo vytvoriť." }, { status: 500 });
  }

  await regenerateSlots(event.id);

  return NextResponse.json({ event });
}
