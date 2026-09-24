import { createServiceClient } from "@/lib/supabase/server";
import { first } from "@/lib/supabase/safe";
import type { CreateGroupInput } from "@/lib/validation";
import type { GroupRow, GroupStatus } from "@/types/database";

export interface GroupWithDetails extends GroupRow {
  players: { id: string; name: string }[];
  teams: { id: string; name: string; members: { id: string; name: string }[] }[];
  payment: {
    id: string;
    status: string;
    method: string;
    amount_cents: number;
  } | null;
  slot: { id: string; start_time: string; end_time: string } | null;
}

export async function createGroup(input: CreateGroupInput, depositCents: number) {
  const supabase = createServiceClient();

  const { data: groupNumber, error: numErr } = await supabase.rpc("next_group_number", {
    p_event_id: input.eventId
  });
  if (numErr) throw numErr;

  const { data: groupId, error: reserveErr } = await supabase.rpc("reserve_slot", {
    p_event_id: input.eventId,
    p_slot_id: input.slotId,
    p_group_number: groupNumber,
    p_contact_name: input.contactName,
    p_contact_email: input.contactEmail,
    p_contact_phone: input.contactPhone ?? null,
    p_mode: input.mode,
    p_player_count: input.players.length,
    p_source: input.source
  });

  if (reserveErr) {
    if (reserveErr.message?.includes("SLOT_UNAVAILABLE")) {
      throw new Error("SLOT_UNAVAILABLE");
    }
    throw reserveErr;
  }

  const playerInserts = input.players.map((name) => ({ group_id: groupId, name }));
  const { data: insertedPlayers, error: playersErr } = await supabase
    .from("players")
    .insert(playerInserts)
    .select("id, name");

  if (playersErr) throw playersErr;

  if (input.mode === "TEAMS" && input.teams) {
    for (const team of input.teams) {
      const { data: teamRows, error: teamErr } = await supabase
        .from("teams")
        .insert({ group_id: groupId, name: team.name })
        .select("id");
      if (teamErr) throw teamErr;

      const teamRow = first(teamRows);
      if (!teamRow) throw new Error("TEAM_INSERT_FAILED");

      const memberIds = (insertedPlayers ?? [])
        .filter((p) => team.playerNames.includes(p.name))
        .map((p) => ({ team_id: teamRow.id, player_id: p.id }));

      if (memberIds.length > 0) {
        const { error: memberErr } = await supabase.from("team_members").insert(memberIds);
        if (memberErr) throw memberErr;
      }
    }
  }

  const method = input.source === "KIOSK" ? "CASH" : "ONLINE";
  const paymentStatus = input.source === "KIOSK" ? "WAITING_CASH" : "PENDING";

  const { data: paymentRows, error: paymentErr } = await supabase
    .from("payments")
    .insert({
      group_id: groupId,
      amount_cents: depositCents,
      status: paymentStatus,
      method
    })
    .select("id");

  if (paymentErr) throw paymentErr;

  const payment = first(paymentRows);
  if (!payment) throw new Error("PAYMENT_INSERT_FAILED");

  return { groupId: groupId as string, groupNumber: groupNumber as number, paymentId: payment.id as string };
}

export async function listGroupsForEvent(eventId: string): Promise<GroupWithDetails[]> {
  const supabase = createServiceClient();
  const { data: groups, error } = await supabase
    .from("groups")
    .select("*")
    .eq("event_id", eventId)
    .order("group_number", { ascending: true });

  if (error) throw error;
  if (!groups || groups.length === 0) return [];

  const groupIds = groups.map((g) => g.id);

  const [{ data: players }, { data: teams }, { data: members }, { data: payments }, { data: slots }] =
    await Promise.all([
      supabase.from("players").select("id, group_id, name").in("group_id", groupIds),
      supabase.from("teams").select("id, group_id, name").in("group_id", groupIds),
      supabase.from("team_members").select("id, team_id, player_id"),
      supabase.from("payments").select("id, group_id, status, method, amount_cents").in("group_id", groupIds),
      supabase.from("game_slots").select("id, start_time, end_time")
    ]);

  return groups.map((g) => {
    const groupPlayers = (players ?? []).filter((p) => p.group_id === g.id);
    const groupTeams = (teams ?? [])
      .filter((t) => t.group_id === g.id)
      .map((t) => ({
        id: t.id,
        name: t.name,
        members: (members ?? [])
          .filter((m) => m.team_id === t.id)
          .map((m) => {
            const p = groupPlayers.find((pl) => pl.id === m.player_id);
            return { id: m.player_id, name: p?.name ?? "" };
          })
      }));
    const payment = (payments ?? []).find((p) => p.group_id === g.id) ?? null;
    const slot = g.slot_id ? (slots ?? []).find((s) => s.id === g.slot_id) ?? null : null;

    return {
      ...g,
      players: groupPlayers.map((p) => ({ id: p.id, name: p.name })),
      teams: groupTeams,
      payment,
      slot
    };
  });
}

export async function updateGroupStatus(groupId: string, status: GroupStatus) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("groups").update({ status }).eq("id", groupId);
  if (error) throw error;
}

export async function markGroupArrived(groupId: string, arrived: boolean) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("groups").update({ arrived }).eq("id", groupId);
  if (error) throw error;
}

export async function getGroupById(groupId: string): Promise<GroupRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("groups").select("*").eq("id", groupId).limit(1);
  if (error) throw error;
  return first(data);
}
