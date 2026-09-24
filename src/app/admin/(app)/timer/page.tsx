"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatGroupNumber } from "@/lib/utils";
import { useServerNow, formatCountdown } from "@/lib/useServerNow";

interface BoardData {
  event: { id: string } | null;
  current: {
    session: { id: string; state: string; countdown_started_at: string | null; game_ends_at: string | null };
    details: { group: { group_number: number } } | null;
  } | null;
  serverTime: string;
}

export default function AdminTimerPage() {
  const [data, setData] = useState<BoardData | null>(null);
  const [busy, setBusy] = useState(false);
  const getNow = useServerNow(data?.serverTime ?? null);

  async function load() {
    const res = await fetch("/api/board", { cache: "no-store" });
    const json = await res.json();
    setData(json);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  async function call(action: "call-next" | "countdown" | "start" | "finish" | "skip") {
    setBusy(true);
    const res = await fetch(`/api/admin/game/${action}`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) alert(json.error ?? "Akcia zlyhala.");
    await load();
    setBusy(false);
  }

  const session = data?.current?.session;
  const group = data?.current?.details?.group;

  let display = "10:00";
  if (session?.state === "COUNTDOWN" && session.countdown_started_at) {
    const remaining = new Date(session.countdown_started_at).getTime() - getNow();
    display = remaining > 0 ? String(Math.ceil(remaining / 1000)) : "GO!";
    if (remaining <= 0 && !busy) {
      call("start");
    }
  } else if (session?.state === "PLAYING" && session.game_ends_at) {
    const remaining = new Date(session.game_ends_at).getTime() - getNow();
    display = formatCountdown(remaining);
    if (remaining <= 0 && !busy) {
      call("finish");
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Timer</h1>

      <Card className="text-center space-y-6 py-12">
        <p className="text-white/50">{group ? `Skupina ${formatGroupNumber(group.group_number)}` : "Žiadna aktuálna skupina"}</p>
        <p className="font-display text-8xl font-black tabular-nums">{display}</p>
        <p className="text-white/40 uppercase tracking-widest text-sm">{session?.state ?? "WAITING"}</p>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Button size="lg" onClick={() => call("call-next")} disabled={busy}>ĎALŠIA</Button>
        <Button size="lg" variant="secondary" onClick={() => call("countdown")} disabled={busy || !session}>SPUSTIŤ</Button>
        <Button size="lg" variant="ghost" onClick={() => call("skip")} disabled={busy || !session}>PRESKOČIŤ</Button>
        <Button size="lg" variant="danger" onClick={() => call("finish")} disabled={busy || !session}>UKONČIŤ</Button>
      </div>
    </div>
  );
}
