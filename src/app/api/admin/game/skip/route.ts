import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin/guard";
import { getActiveEvent } from "@/lib/data/events";
import { getCurrentSession } from "@/lib/data/sessions";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  const denied = await guardAdmin();
  if (denied) return denied;

  const event = await getActiveEvent();
  if (!event) {
    return NextResponse.json({ error: "Neexistuje aktívny event." }, { status: 400 });
  }

  const session = await getCurrentSession(event.id);
  if (!session) {
    return NextResponse.json({ error: "Žiadna aktuálna skupina." }, { status: 400 });
  }

  const supabase = createServiceClient();

  await supabase.from("game_sessions").update({ state: "SKIPPED", is_current: false }).eq("id", session.id);

  if (session.group_id) {
    await supabase.from("groups").update({ status: "SKIPPED" }).eq("id", session.group_id);
  }

  return NextResponse.json({ success: true });
}
