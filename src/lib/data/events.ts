import { createServiceClient } from "@/lib/supabase/server";
import type { EventRow } from "@/types/database";

export async function getActiveEvent(): Promise<EventRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getEventById(id: string): Promise<EventRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listEvents(): Promise<EventRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function regenerateSlots(eventId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.rpc("generate_slots_for_event", { p_event_id: eventId });
  if (error) throw error;
}
