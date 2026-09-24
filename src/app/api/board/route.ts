import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getActiveEvent } from "@/lib/data/events";
import { getRules } from "@/lib/data/settings";
import { first } from "@/lib/supabase/safe";

export const dynamic = "force-dynamic";

export async function GET() {
  const event = await getActiveEvent();
  const rules = await getRules();

  if (!event) {
    return NextResponse.json({ event: null, rules, current: null, next: null });
  }

  const supabase = createServiceClient();

  const { data: sessionRows } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("event_id", event.id)
    .eq("is_current", true)
    .limit(1);

  const session = first(sessionRows);

  async function loadGroupDetails(groupId: string | null) {
    if (!groupId) return null;
    const [{ data: groupRows }, { data: players }, { data: teams }, { data: members }] = await Promise.all([
      supabase.from("groups").select("*").eq("id", groupId).limit(1),
      supabase.from("players").select("id, name").eq("group_id", groupId),
      supabase.from("teams").select("id, name").eq("group_id", groupId),
      supabase.from("team_members").select("team_id, player_id")
    ]);

    const group = first(groupRows);
    if (!group) return null;

    let slotData = null;
    if (group.slot_id) {
      const { data: slotRows } = await supabase.from("game_slots").select("*").eq("id", group.slot_id).limit(1);
      slotData = first(slotRows);
    }

    const teamsWithMembers = (teams ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      members: (members ?? [])
        .filter((m) => m.team_id === t.id)
        .map((m) => (players ?? []).find((p) => p.id === m.player_id)?.name)
        .filter(Boolean)
    }));

    return { group, players: players ?? [], teams: teamsWithMembers, slot: slotData };
  }

  const current = session ? { session, details: await loadGroupDetails(session.group_id) } : null;

  const { data: confirmedGroups } = await supabase
    .from("groups")
    .select("id, slot_id")
    .eq("event_id", event.id)
    .eq("status", "CONFIRMED");

  let next = null;
  if (confirmedGroups && confirmedGroups.length > 0) {
    const slotIds = confirmedGroups.map((g) => g.slot_id).filter(Boolean) as string[];
    const { data: slots } = await supabase.from("game_slots").select("id, start_time").in("id", slotIds);
    const sorted = [...confirmedGroups].sort((a, b) => {
      const sa = slots?.find((s) => s.id === a.slot_id)?.start_time ?? "";
      const sb = slots?.find((s) => s.id === b.slot_id)?.start_time ?? "";
      return sa.localeCompare(sb);
    });
    next = await loadGroupDetails(sorted[0].id);
  }

  return NextResponse.json({ event, rules, current, next, serverTime: new Date().toISOString() });
}
