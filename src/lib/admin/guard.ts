import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";

export async function guardAdmin(): Promise<NextResponse | null> {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Neautorizovaný prístup." }, { status: 401 });
  }
  return null;
}
