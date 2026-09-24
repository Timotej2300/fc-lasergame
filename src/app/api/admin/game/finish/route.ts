import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin/guard";
import { getActiveEvent } from "@/lib/data/events";
import { getCurrentSession, finishSession } from "@/lib/data/sessions";

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

  await finishSession(session.id);

  return NextResponse.json({ success: true });
}
