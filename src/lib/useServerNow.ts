"use client";

import { useEffect, useRef, useState } from "react";

export function useServerNow(serverTimeIso: string | null) {
  const offsetRef = useRef(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (serverTimeIso) {
      offsetRef.current = new Date(serverTimeIso).getTime() - Date.now();
    }
  }, [serverTimeIso]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(interval);
  }, []);

  void tick;
  return () => Date.now() + offsetRef.current;
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
