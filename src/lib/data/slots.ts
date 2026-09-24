import { createServiceClient } from "@/lib/supabase/server";
import type { GameSlotRow } from "@/types/database";

export async function listSlotsForEvent(eventId: string): Promise<GameSlotRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("game_slots")
    .select("*")
    .eq("event_id", eventId)
    .order("slot_index", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
