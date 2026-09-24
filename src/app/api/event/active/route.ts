import { NextResponse } from "next/server";
import { getActiveEvent } from "@/lib/data/events";
import { listSlotsForEvent } from "@/lib/data/slots";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const event = await getActiveEvent();
    if (!event) {
      return NextResponse.json({ event: null, slots: [] });
    }
    const slots = await listSlotsForEvent(event.id);
    return NextResponse.json({ event, slots });
  } catch (err) {
    return NextResponse.json({ error: "Nepodarilo sa načítať event." }, { status: 500 });
  }
}
