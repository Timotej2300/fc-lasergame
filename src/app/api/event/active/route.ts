import { NextResponse } from "next/server";
import { getActiveEvent } from "@/lib/data/events";
import { listSlotsForEvent } from "@/lib/data/slots";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function noStore(body: unknown, init?: ResponseInit) {
  const res = NextResponse.json(body, init);
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

export async function GET() {
  try {
    const event = await getActiveEvent();
    if (!event) {
      return noStore({ event: null, slots: [] });
    }
    const slots = await listSlotsForEvent(event.id);
    return noStore({ event, slots });
  } catch (err) {
    return noStore({ error: "Nepodarilo sa načítať event." }, { status: 500 });
  }
}
