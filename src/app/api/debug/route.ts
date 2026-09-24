import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "MISSING";
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasService = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  let count: number | null = null;
  let error: string | null = null;

  try {
    const supabase = createServiceClient();
    const { count: c, error: e } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true });
    count = c;
    error = e?.message ?? null;
  } catch (err) {
    error = err instanceof Error ? err.message : "unknown error";
  }

  return NextResponse.json({ url, hasAnon, hasService, count, error });
}
