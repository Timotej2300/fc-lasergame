"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatEventDate } from "@/lib/utils";

interface EventItem {
  id: string;
  name: string;
  event_date: string;
  start_time: string;
  end_time: string;
  game_duration_minutes: number;
  break_duration_minutes: number;
  min_players: number;
  max_players: number;
  countdown_seconds: number;
  countdown_enabled: boolean;
  deposit_amount_cents: number;
  is_active: boolean;
}

const emptyForm = {
  name: "LaserGame FaceClub",
  eventDate: "",
  startTime: "18:00",
  endTime: "21:00",
  gameDurationMinutes: 10,
  breakDurationMinutes: 5,
  minPlayers: 2,
  maxPlayers: 8,
  countdownSeconds: 5,
  countdownEnabled: true,
  depositAmountCents: 100
};

export default function AdminEventPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/event");
    const data = await res.json();
    setEvents(data.events ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Nepodarilo sa vytvoriť event.");
    } else {
      setForm(emptyForm);
      await load();
    }
    setSaving(false);
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/event/${id}/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active })
    });
    load();
  }

  async function deleteEvent(id: string) {
    if (!confirm("Naozaj zmazať tento event?")) return;
    await fetch(`/api/admin/event/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">Eventy</h1>

      <Card className="max-w-2xl">
        <h2 className="font-display font-bold text-xl mb-4">Vytvoriť nový event</h2>
        <form onSubmit={createEvent} className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm space-y-1">
            <span className="text-white/50">Názov</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl bg-panel2 border border-white/10 px-3 py-2" />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-white/50">Dátum</span>
            <input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} className="w-full rounded-xl bg-panel2 border border-white/10 px-3 py-2" />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-white/50">Začiatok</span>
            <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full rounded-xl bg-panel2 border border-white/10 px-3 py-2" />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-white/50">Koniec</span>
            <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full rounded-xl bg-panel2 border border-white/10 px-3 py-2" />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-white/50">Dĺžka hry (min)</span>
            <input type="number" value={form.gameDurationMinutes} onChange={(e) => setForm({ ...form, gameDurationMinutes: Number(e.target.value) })} className="w-full rounded-xl bg-panel2 border border-white/10 px-3 py-2" />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-white/50">Prestávka (min)</span>
            <input type="number" value={form.breakDurationMinutes} onChange={(e) => setForm({ ...form, breakDurationMinutes: Number(e.target.value) })} className="w-full rounded-xl bg-panel2 border border-white/10 px-3 py-2" />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-white/50">Min. hráčov</span>
            <input type="number" value={form.minPlayers} onChange={(e) => setForm({ ...form, minPlayers: Number(e.target.value) })} className="w-full rounded-xl bg-panel2 border border-white/10 px-3 py-2" />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-white/50">Max. hráčov</span>
            <input type="number" value={form.maxPlayers} onChange={(e) => setForm({ ...form, maxPlayers: Number(e.target.value) })} className="w-full rounded-xl bg-panel2 border border-white/10 px-3 py-2" />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-white/50">Countdown (s)</span>
            <input type="number" value={form.countdownSeconds} onChange={(e) => setForm({ ...form, countdownSeconds: Number(e.target.value) })} className="w-full rounded-xl bg-panel2 border border-white/10 px-3 py-2" />
          </label>
          <label className="text-sm space-y-1 flex items-center gap-2 mt-6">
            <input type="checkbox" checked={form.countdownEnabled} onChange={(e) => setForm({ ...form, countdownEnabled: e.target.checked })} />
            <span className="text-white/50">Countdown zapnutý</span>
          </label>
          <label className="text-sm space-y-1">
            <span className="text-white/50">Záloha (centy)</span>
            <input type="number" value={form.depositAmountCents} onChange={(e) => setForm({ ...form, depositAmountCents: Number(e.target.value) })} className="w-full rounded-xl bg-panel2 border border-white/10 px-3 py-2" />
          </label>

          {error && <p className="text-danger text-sm sm:col-span-2">{error}</p>}
          <Button type="submit" size="lg" className="sm:col-span-2" disabled={saving}>
            {saving ? "Ukladám..." : "Vytvoriť event"}
          </Button>
        </form>
      </Card>

      <div className="space-y-3">
        {events.map((ev) => (
          <Card key={ev.id} className="flex flex-wrap items-center gap-4 justify-between">
            <div>
              <p className="font-display font-bold">{ev.name}</p>
              <p className="text-sm text-white/50">
                {formatEventDate(ev.event_date)} · {ev.start_time.slice(0, 5)}–{ev.end_time.slice(0, 5)} · hra {ev.game_duration_minutes}min / prestávka {ev.break_duration_minutes}min
              </p>
            </div>
            <div className="flex gap-2 items-center">
              {ev.is_active ? (
                <span className="px-3 py-1 rounded-full bg-ok/15 text-ok text-xs font-bold">AKTÍVNY</span>
              ) : (
                <Button variant="secondary" size="md" onClick={() => toggleActive(ev.id, true)}>Aktivovať</Button>
              )}
              {ev.is_active && (
                <Button variant="ghost" size="md" onClick={() => toggleActive(ev.id, false)}>Deaktivovať</Button>
              )}
              <Button variant="danger" size="md" onClick={() => deleteEvent(ev.id)}>Zmazať</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
