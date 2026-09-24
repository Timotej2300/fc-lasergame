import { NextResponse } from "next/server";
import { isAdminAuthenticated, clearAdminCookie } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const ok = await isAdminAuthenticated();
  return NextResponse.json({ authenticated: ok });
}

export async function DELETE() {
  await clearAdminCookie();
  return NextResponse.json({ success: true });
}
