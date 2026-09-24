"use client";

import { useEffect, useRef, useState } from "react";
import { formatGroupNumber, formatSlotTime } from "@/lib/utils";
import { useServerNow, formatCountdown } from "@/lib/useServerNow";
import { NoActiveEvent } from "@/components/booking/NoActiveEvent";
import { subscribeToEventChanges } from "@/lib/realtime";

interface GroupDetails {
  group: { id: string; group_number: number };
  players: { id: string; name: string }[];
  teams: { id: string; name: string; members: (string | undefined)[] }[];
  slot: { start_time: string; end_time: string } | null;
}

interface BoardData {
  event: { id: string; name: string } | null;
  rules: string;
  current: { session: { state: string; countdown_started_at: string | null; game_ends_at: string | null }; details: GroupDetails | null } | null;
  next: GroupDetails | null;
  serverTime: string;
}

export function Board() {
  const [data, setData] = useState<BoardData | null>(null);
  const [serverTime, setServerTime] = useState<string | null>(null);
  const getNow = useServerNow(serverTime);
  const prevState = useRef<string | null>(null);
  const [showCalled, setShowCalled] = useState(false);

  async function load() {
    const res = await fetch("/api/board", { cache: "no-store" });
    if (!res.ok) return;
    const json: BoardData = await res.json();
    setServerTime(json.serverTime);

    const newState = json.current?.session.state ?? null;
    if (newState === "CALLED" && prevState.current !== "CALLED") {
      setShowCalled(true);
      setTimeout(() => setShowCalled(false), 6000);
    }
    prevState.current = newState;
    setData(json);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data?.event?.id) return;
    const unsubscribe = subscribeToEventChanges(data.event.id, load);
    return unsubscribe;
  }, [data?.event?.id]);

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-white/40 text-2xl">Načítavam...</p>
      </main>
    );
  }

  if (!data.event) {
    return <NoActiveEvent />;
  }

  const session = data.current?.session;
  const details = data.current?.details;
  let countdownMs: number | null = null;
  let remainingLabel = "";

  if (session?.state === "COUNTDOWN" && session.countdown_started_at) {
    const target = new Date(session.countdown_started_at).getTime();
    countdownMs = target - getNow();
  } else if (session?.state === "PLAYING" && session.game_ends_at) {
    countdownMs = new Date(session.game_ends_at).getTime() - getNow();
    remainingLabel = formatCountdown(countdownMs);
  }

  return (
    <main className="min-h-screen p-8 lg:p-14 flex flex-col gap-10">
      {showCalled && details?.group && (
        <div className="fixed inset-0 z-50 bg-bg/95 flex flex-col items-center justify-center gap-6 animate-flash">
          <p className="font-display text-3xl md:text-5xl tracking-widest">🔔 SKUPINA {formatGroupNumber(details.group.group_number)}</p>
          <p className="font-display text-5xl md:text-8xl font-black text-accent">MÔŽETE VSTÚPIŤ</p>
        </div>
      )}

      <header className="text-center">
        <h1 className="font-display text-3xl lg:text-5xl font-black tracking-wide">{data.event.name}</h1>
      </header>

      <section className="flex-1 grid lg:grid-cols-2 gap-8">
        <div className="glass rounded-[2.5rem] p-10 flex flex-col gap-6">
          <p className="font-display text-xl tracking-widest text-accent2 uppercase">Teraz hrá</p>
          {details?.group ? (
            <>
              <p className="font-display text-6xl lg:text-8xl font-black text-glow">
                {formatGroupNumber(details.group.group_number)}
              </p>
              {details.slot && (
                <p className="text-white/60 text-xl">{formatSlotTime(details.slot.start_time, details.slot.end_time)}</p>
              )}
              {session?.state === "PLAYING" && countdownMs !== null && (
                <p className="font-display text-7xl lg:text-9xl font-black tabular-nums">{remainingLabel}</p>
              )}
              {session?.state === "COUNTDOWN" && countdownMs !== null && countdownMs > 0 && (
                <p className="font-display text-8xl font-black animate-pulseSlow">
                  {Math.ceil(countdownMs / 1000)}
                </p>
              )}
              <div className="text-lg space-y-1">
                {details.teams.length > 0
                  ? details.teams.map((t) => (
                      <p key={t.id}>
                        <span className="text-accent2 font-bold">{t.name}:</span> {t.members.join(", ")}
                      </p>
                    ))
                  : details.players.map((p) => <p key={p.id}>{p.name}</p>)}
              </div>
            </>
          ) : (
            <p className="text-white/40 text-2xl">Čaká sa na ďalšiu skupinu...</p>
          )}
        </div>

        <div className="glass rounded-[2.5rem] p-10 flex flex-col gap-6">
          <p className="font-display text-xl tracking-widest text-white/50 uppercase">Ďalšia skupina</p>
          {data.next?.group ? (
            <>
              <p className="font-display text-5xl lg:text-7xl font-black">{formatGroupNumber(data.next.group.group_number)}</p>
              {data.next.slot && (
                <p className="text-white/60 text-xl">{formatSlotTime(data.next.slot.start_time, data.next.slot.end_time)}</p>
              )}
            </>
          ) : (
            <p className="text-white/40 text-xl">Žiadna ďalšia skupina</p>
          )}

          <div className="mt-auto">
            <p className="font-display text-sm tracking-widest text-white/40 uppercase mb-2">Pravidlá</p>
            <pre className="whitespace-pre-wrap text-white/50 text-sm font-body">{data.rules}</pre>
          </div>
        </div>
      </section>
    </main>
  );
}
