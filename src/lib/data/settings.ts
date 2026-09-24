import { createServiceClient } from "@/lib/supabase/server";
import { first } from "@/lib/supabase/safe";

export async function getRules(): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("rules").select("content").eq("id", 1).limit(1);
  if (error) throw error;
  return first(data)?.content ?? "";
}

export async function updateRules(content: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("rules").update({ content }).eq("id", 1);
  if (error) throw error;
}
