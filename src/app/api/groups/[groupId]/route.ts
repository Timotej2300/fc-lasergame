import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: { groupId: string } }) {
  const supabase = createServiceClient();

  const { data: group, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", params.groupId)
    .maybeSingle();

  if (error || !group) {
    return NextResponse.json({ error: "Skupina nebola nájdená." }, { status: 404 });
  }

  const [{ data: players }, { data: payment }, { data: slot }] = await Promise.all([
    supabase.from("players").select("id, name").eq("group_id", group.id),
    supabase.from("payments").select("*").eq("group_id", group.id).maybeSingle(),
    group.slot_id
      ? supabase.from("game_slots").select("*").eq("id", group.slot_id).maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  return NextResponse.json({ group, players: players ?? [], payment, slot });
}
