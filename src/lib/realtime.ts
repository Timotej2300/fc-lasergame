import { createBrowserClient } from "@/lib/supabase/client";

type ChangeHandler = () => void;

export function subscribeToEventChanges(eventId: string, onChange: ChangeHandler) {
  const supabase = createBrowserClient();

  const channel = supabase
    .channel(`event-${eventId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "groups", filter: `event_id=eq.${eventId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "game_slots", filter: `event_id=eq.${eventId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "game_sessions", filter: `event_id=eq.${eventId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "players" }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
