import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServiceClient();

  const all = await supabase.from("events").select("*");
  const filtered = await supabase.from("events").select("*").eq("is_active", true);
  const single = await supabase.from("events").select("*").eq("is_active", true).maybeSingle();

  return NextResponse.json({
    all: { data: all.data, error: all.error?.message ?? null },
    filtered: { data: filtered.data, error: filtered.error?.message ?? null },
    single: { data: single.data, error: single.error?.message ?? null }
  });
}
