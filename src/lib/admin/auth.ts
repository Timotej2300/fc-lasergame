import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

const SESSION_COOKIE = "fc_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function hash(value: string) {
  const secret = process.env.ADMIN_SESSION_SECRET || "fallback-secret-change-me";
  return createHash("sha256").update(`${secret}:${value}`).digest("hex");
}

export async function verifyAdminCode(code: string): Promise<boolean> {
  const expected = process.env.ADMIN_ACCESS_CODE;
  if (!expected) return false;
  const a = Buffer.from(hash(code));
  const b = Buffer.from(hash(expected));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function createAdminSession(): Promise<string> {
  const supabase = createServiceClient();

  let { data: admin } = await supabase
    .from("admins")
    .select("id")
    .eq("label", "faceclub")
    .maybeSingle();

  if (!admin) {
    const inserted = await supabase
      .from("admins")
      .insert({ label: "faceclub", code_hash: hash(process.env.ADMIN_ACCESS_CODE || "") })
      .select("id")
      .single();
    admin = inserted.data;
  }

  if (!admin) throw new Error("Could not create admin record");

  const token = randomBytes(32).toString("hex");
  const tokenHash = hash(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  await supabase.from("admin_sessions").insert({
    admin_id: admin.id,
    token_hash: tokenHash,
    expires_at: expiresAt
  });

  return token;
}

export async function setAdminCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("admin_sessions")
    .select("expires_at")
    .eq("token_hash", hash(token))
    .maybeSingle();

  if (!data) return false;
  return new Date(data.expires_at).getTime() > Date.now();
}

export async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    throw new Error("UNAUTHORIZED");
  }
}
