import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/server";
import { first } from "@/lib/supabase/safe";

export async function POST(req: Request, { params }: { params: { eventId: string } }) {
  const denied = await guardAdmin();
  if (denied) return denied;

  let body: { active?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    // no body means "deactivate"
  }

  const supabase = createServiceClient();
  const active = body.active ?? false;

  if (active) {
    await supabase.from("events").update({ is_active: false }).neq("id", params.eventId);
  }

  const { data: eventRows, error } = await supabase
    .from("events")
    .update({ is_active: active })
    .eq("id", params.eventId)
    .select("*");

  const event = first(eventRows);

  if (error || !event) {
    return NextResponse.json({ error: "Nepodarilo sa zmeniť stav eventu." }, { status: 500 });
  }

  return NextResponse.json({ event });
}
