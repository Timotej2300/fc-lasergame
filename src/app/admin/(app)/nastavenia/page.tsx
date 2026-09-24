"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface EventSettings {
  id: string;
  game_duration_minutes: number;
  break_duration_minutes: number;
  min_players: number;
  max_players: number;
  countdown_seconds: number;
  countdown_enabled: boolean;
  deposit_amount_cents: number;
}

export default function AdminNastaveniaPage() {
  const [event, setEvent] = useState<EventSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/settings");
    const data = await res.json();
    setEvent(data.event);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!event) return;
    setSaving(true);
    setSaved(false);

    await fetch(`/api/admin/event/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameDurationMinutes: event.game_duration_minutes,
        breakDurationMinutes: event.break_duration_minutes,
        minPlayers: event.min_players,
        maxPlayers: event.max_players,
        countdownSeconds: event.countdown_seconds,
        countdownEnabled: event.countdown_enabled,
        depositAmountCents: event.deposit_amount_cents
      })
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!event) {
    return <Card className="max-w-lg"><p>Neexistuje aktívny event na úpravu nastavení.</p></Card>;
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="font-display text-3xl font-bold">Nastavenia</h1>
      <Card className="grid sm:grid-cols-2 gap-4">
        <label className="text-sm space-y-1">
          <span className="text-white/50">Dĺžka hry (min)</span>
          <input type="number" value={event.game_duration_minutes} onChange={(e) => setEvent({ ...event, game_duration_minutes: Number(e.target.value) })} className="w-full rounded-xl bg-panel2 border border-white/10 px-3 py-2" />
        </label>
        <label className="text-sm space-y-1">
          <span className="text-white/50">Prestávka (min)</span>
          <input type="number" value={event.break_duration_minutes} onChange={(e) => setEvent({ ...event, break_duration_minutes: Number(e.target.value) })} className="w-full rounded-xl bg-panel2 border border-white/10 px-3 py-2" />
        </label>
        <label className="text-sm space-y-1">
          <span className="text-white/50">Minimum hráčov</span>
          <input type="number" value={event.min_players} onChange={(e) => setEvent({ ...event, min_players: Number(e.target.value) })} className="w-full rounded-xl bg-panel2 border border-white/10 px-3 py-2" />
        </label>
        <label className="text-sm space-y-1">
          <span className="text-white/50">Maximum hráčov</span>
          <input type="number" value={event.max_players} onChange={(e) => setEvent({ ...event, max_players: Number(e.target.value) })} className="w-full rounded-xl bg-panel2 border border-white/10 px-3 py-2" />
        </label>
        <label className="text-sm space-y-1">
          <span className="text-white/50">Countdown (s)</span>
          <input type="number" value={event.countdown_seconds} onChange={(e) => setEvent({ ...event, countdown_seconds: Number(e.target.value) })} className="w-full rounded-xl bg-panel2 border border-white/10 px-3 py-2" />
        </label>
        <label className="text-sm flex items-center gap-2 mt-6">
          <input type="checkbox" checked={event.countdown_enabled} onChange={(e) => setEvent({ ...event, countdown_enabled: e.target.checked })} />
          <span className="text-white/50">Countdown zapnutý</span>
        </label>
        <label className="text-sm space-y-1">
          <span className="text-white/50">Online záloha (centy)</span>
          <input type="number" value={event.deposit_amount_cents} onChange={(e) => setEvent({ ...event, deposit_amount_cents: Number(e.target.value) })} className="w-full rounded-xl bg-panel2 border border-white/10 px-3 py-2" />
        </label>
        <div className="sm:col-span-2 flex items-center gap-3">
          <Button onClick={save} disabled={saving}>{saving ? "Ukladám..." : "Uložiť nastavenia"}</Button>
          {saved && <span className="text-ok text-sm">Uložené ✓</span>}
        </div>
      </Card>
    </div>
  );
}
