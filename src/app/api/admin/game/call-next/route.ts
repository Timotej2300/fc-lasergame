import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/server";
import { getActiveEvent } from "@/lib/data/events";
import { callNextGroup } from "@/lib/data/sessions";

export async function POST() {
  const denied = await guardAdmin();
  if (denied) return denied;

  const event = await getActiveEvent();
  if (!event) {
    return NextResponse.json({ error: "Neexistuje aktívny event." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: groups, error } = await supabase
    .from("groups")
    .select("id, slot_id, status")
    .eq("event_id", event.id)
    .eq("status", "CONFIRMED");

  if (error) {
    return NextResponse.json({ error: "Nepodarilo sa načítať skupiny." }, { status: 500 });
  }

  if (!groups || groups.length === 0) {
    return NextResponse.json({ error: "Žiadna skupina nečaká na zavolanie." }, { status: 400 });
  }

  const slotIds = groups.map((g) => g.slot_id).filter(Boolean) as string[];
  const { data: slots } = await supabase.from("game_slots").select("id, start_time").in("id", slotIds);

  const sorted = [...groups].sort((a, b) => {
    const sa = slots?.find((s) => s.id === a.slot_id)?.start_time ?? "";
    const sb = slots?.find((s) => s.id === b.slot_id)?.start_time ?? "";
    return sa.localeCompare(sb);
  });

  const next = sorted[0];
  const session = await callNextGroup(event.id, next.id, next.slot_id);

  return NextResponse.json({ session });
}
