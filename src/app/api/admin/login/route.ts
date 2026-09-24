import { NextResponse } from "next/server";
import { adminLoginSchema } from "@/lib/validation";
import { verifyAdminCode, createAdminSession, setAdminCookie } from "@/lib/admin/auth";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatná požiadavka." }, { status: 400 });
  }

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Zadaj prístupový kód." }, { status: 400 });
  }

  const ok = await verifyAdminCode(parsed.data.code);
  if (!ok) {
    return NextResponse.json({ error: "Nesprávny prístupový kód." }, { status: 401 });
  }

  const token = await createAdminSession();
  await setAdminCookie(token);

  return NextResponse.json({ success: true });
}
