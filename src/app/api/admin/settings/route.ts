import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin/guard";
import { getActiveEvent } from "@/lib/data/events";

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;

  const event = await getActiveEvent();
  return NextResponse.json({ event });
}
