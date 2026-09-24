import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin/guard";
import { listGroupsForEvent } from "@/lib/data/groups";

export async function GET(req: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "Chýba eventId." }, { status: 400 });
  }

  const groups = await listGroupsForEvent(eventId);
  return NextResponse.json({ groups });
}
