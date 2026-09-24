import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { first } from "@/lib/supabase/safe";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { groupId: string } }) {
  const supabase = createServiceClient();

  const { data: groupRows, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", params.groupId)
    .limit(1);

  const group = first(groupRows);

  if (error || !group) {
    return NextResponse.json({ error: "Skupina nebola nájdená." }, { status: 404 });
  }

  const [{ data: players }, { data: paymentRows }, { data: slotRows }] = await Promise.all([
    supabase.from("players").select("id, name").eq("group_id", group.id),
    supabase.from("payments").select("*").eq("group_id", group.id).limit(1),
    group.slot_id
      ? supabase.from("game_slots").select("*").eq("id", group.slot_id).limit(1)
      : Promise.resolve({ data: null })
  ]);

  return NextResponse.json({
    group,
    players: players ?? [],
    payment: first(paymentRows as any[] | null),
    slot: first(slotRows as any[] | null)
  });
}
