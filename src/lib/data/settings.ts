import { createServiceClient } from "@/lib/supabase/server";

export async function getRules(): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("rules").select("content").eq("id", 1).maybeSingle();
  if (error) throw error;
  return data?.content ?? "";
}

export async function updateRules(content: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("rules").update({ content }).eq("id", 1);
  if (error) throw error;
}
