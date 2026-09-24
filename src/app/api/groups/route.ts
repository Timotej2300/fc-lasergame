import { NextResponse } from "next/server";
import { createGroupSchema } from "@/lib/validation";
import { createGroup } from "@/lib/data/groups";
import { getEventById } from "@/lib/data/events";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatná požiadavka." }, { status: 400 });
  }

  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Neplatné údaje." }, { status: 400 });
  }

  const input = parsed.data;
  const event = await getEventById(input.eventId);

  if (!event || !event.is_active) {
    return NextResponse.json({ error: "Momentálne nemáme naplánovaný žiadny LaserGame event." }, { status: 400 });
  }

  const totalPlayers = input.players.length;
  if (totalPlayers < event.min_players) {
    return NextResponse.json({ error: `Minimálny počet hráčov je ${event.min_players}.` }, { status: 400 });
  }
  if (totalPlayers > event.max_players) {
    return NextResponse.json({ error: `Maximálny počet hráčov je ${event.max_players}.` }, { status: 400 });
  }

  try {
    const result = await createGroup(input, event.deposit_amount_cents);
    return NextResponse.json({
      groupId: result.groupId,
      groupNumber: result.groupNumber,
      paymentId: result.paymentId
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "SLOT_UNAVAILABLE") {
      return NextResponse.json({ error: "Tento termín už nie je dostupný." }, { status: 409 });
    }
    return NextResponse.json({ error: "Rezerváciu sa nepodarilo vytvoriť." }, { status: 500 });
  }
}
