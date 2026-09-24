import { createServiceClient } from "@/lib/supabase/server";
import type { GameSessionRow } from "@/types/database";

export async function getCurrentSession(eventId: string): Promise<GameSessionRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_current", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function callNextGroup(eventId: string, groupId: string, slotId: string | null) {
  const supabase = createServiceClient();

  await supabase.from("game_sessions").update({ is_current: false }).eq("event_id", eventId).eq("is_current", true);

  const { data, error } = await supabase
    .from("game_sessions")
    .insert({
      event_id: eventId,
      group_id: groupId,
      slot_id: slotId,
      state: "CALLED",
      is_current: true
    })
    .select("*")
    .single();

  if (error) throw error;

  await supabase.from("groups").update({ status: "CALLED" }).eq("id", groupId);

  return data;
}

export async function startCountdown(sessionId: string, countdownSeconds: number) {
  const supabase = createServiceClient();
  const now = new Date();
  const { data: session } = await supabase.from("game_sessions").select("group_id").eq("id", sessionId).single();

  const { error } = await supabase
    .from("game_sessions")
    .update({
      state: countdownSeconds > 0 ? "COUNTDOWN" : "PLAYING",
      countdown_started_at: now.toISOString(),
      game_started_at: countdownSeconds > 0 ? null : now.toISOString()
    })
    .eq("id", sessionId);

  if (error) throw error;

  if (session?.group_id) {
    await supabase
      .from("groups")
      .update({ status: countdownSeconds > 0 ? "COUNTDOWN" : "PLAYING" })
      .eq("id", session.group_id);
  }
}

export async function startPlaying(sessionId: string, durationMinutes: number) {
  const supabase = createServiceClient();
  const now = new Date();
  const endsAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

  const { data: session } = await supabase.from("game_sessions").select("group_id").eq("id", sessionId).single();

  const { error } = await supabase
    .from("game_sessions")
    .update({
      state: "PLAYING",
      game_started_at: now.toISOString(),
      game_ends_at: endsAt.toISOString()
    })
    .eq("id", sessionId);

  if (error) throw error;

  if (session?.group_id) {
    await supabase.from("groups").update({ status: "PLAYING" }).eq("id", session.group_id);
  }
}

export async function finishSession(sessionId: string) {
  const supabase = createServiceClient();
  const now = new Date();

  const { data: session } = await supabase.from("game_sessions").select("group_id, slot_id").eq("id", sessionId).single();

  const { error } = await supabase
    .from("game_sessions")
    .update({ state: "FINISHED", finished_at: now.toISOString(), is_current: false })
    .eq("id", sessionId);

  if (error) throw error;

  if (session?.group_id) {
    await supabase.from("groups").update({ status: "FINISHED" }).eq("id", session.group_id);
  }
  if (session?.slot_id) {
    await supabase.from("game_slots").update({ status: "COMPLETED" }).eq("id", session.slot_id);
  }
}
