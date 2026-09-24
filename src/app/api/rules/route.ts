import { NextResponse } from "next/server";
import { getRules } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const content = await getRules();
  return NextResponse.json({ content });
}
