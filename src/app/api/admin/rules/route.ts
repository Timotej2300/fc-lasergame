import { NextResponse } from "next/server";
import { z } from "zod";
import { guardAdmin } from "@/lib/admin/guard";
import { getRules, updateRules } from "@/lib/data/settings";

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  const content = await getRules();
  return NextResponse.json({ content });
}

const schema = z.object({ content: z.string().max(5000) });

export async function PUT(req: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatná požiadavka." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatné pravidlá." }, { status: 400 });
  }

  await updateRules(parsed.data.content);
  return NextResponse.json({ success: true });
}
