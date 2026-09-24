"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { formatGroupNumber, formatEventDate, GROUP_STATUS_LABELS } from "@/lib/utils";

interface DashboardData {
  event: { id: string; name: string; event_date: string; start_time: string; end_time: string } | null;
  groups: { id: string; group_number: number; status: string; player_count: number; payment?: { status: string } | null }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  async function load() {
    const eventRes = await fetch("/api/admin/settings");
    const eventData = await eventRes.json();
    if (!eventData.event) {
      setData({ event: null, groups: [] });
      return;
    }
    const groupsRes = await fetch(`/api/admin/groups?eventId=${eventData.event.id}`);
    const groupsData = await groupsRes.json();
    setData({ event: eventData.event, groups: groupsData.groups ?? [] });
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 6000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <p className="text-white/50">Načítavam...</p>;

  if (!data.event) {
    return (
      <Card className="max-w-lg">
        <p>Momentálne neexistuje aktívny event. Vytvor ho v sekcii Event.</p>
      </Card>
    );
  }

  const current = data.groups.find((g) => ["CALLED", "READY", "COUNTDOWN", "PLAYING"].includes(g.status));
  const waiting = data.groups.filter((g) => g.status === "CONFIRMED");
  const toRefund = data.groups.filter((g) => g.payment?.status === "TO_REFUND");
  const totalPlayers = data.groups.reduce((s, g) => s + g.player_count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{data.event.name}</h1>
        <p className="text-white/50">
          {formatEventDate(data.event.event_date)} · {data.event.start_time.slice(0, 5)} – {data.event.end_time.slice(0, 5)}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-white/50 text-sm mb-1">Aktuálna skupina</p>
          <p className="font-display text-2xl font-bold">{current ? formatGroupNumber(current.group_number) : "—"}</p>
        </Card>
        <Card>
          <p className="text-white/50 text-sm mb-1">Rezervácie</p>
          <p className="font-display text-2xl font-bold">{data.groups.length}</p>
        </Card>
        <Card>
          <p className="text-white/50 text-sm mb-1">Hráči spolu</p>
          <p className="font-display text-2xl font-bold">{totalPlayers}</p>
        </Card>
        <Card>
          <p className="text-white/50 text-sm mb-1">Čakajúce skupiny</p>
          <p className="font-display text-2xl font-bold">{waiting.length}</p>
        </Card>
      </div>

      {toRefund.length > 0 && (
        <Card className="border-warn/30">
          <p className="font-bold text-warn mb-2">Zálohy na vrátenie ({toRefund.length})</p>
          <ul className="text-sm space-y-1">
            {toRefund.map((g) => (
              <li key={g.id}>
                {formatGroupNumber(g.group_number)} — {GROUP_STATUS_LABELS[g.status]}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
