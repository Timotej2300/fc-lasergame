"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatGroupNumber, formatSlotTime, GROUP_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/utils";

interface GroupRow {
  id: string;
  group_number: number;
  mode: string;
  status: string;
  arrived: boolean;
  player_count: number;
  slot: { start_time: string; end_time: string } | null;
  payment: { id: string; status: string; method: string } | null;
  players: { id: string; name: string }[];
}

export default function AdminSkupinyPage() {
  const [eventId, setEventId] = useState<string | null>(null);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const eventRes = await fetch("/api/admin/settings");
    const eventData = await eventRes.json();
    if (!eventData.event) {
      setLoading(false);
      return;
    }
    setEventId(eventData.event.id);
    const res = await fetch(`/api/admin/groups?eventId=${eventData.event.id}`);
    const data = await res.json();
    setGroups(data.groups ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 6000);
    return () => clearInterval(interval);
  }, []);

  async function action(groupId: string, act: string) {
    await fetch(`/api/admin/groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act })
    });
    load();
  }

  async function refund(groupId: string) {
    if (!confirm("Naozaj vrátiť zálohu?")) return;
    const res = await fetch(`/api/admin/groups/${groupId}/refund`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) alert(data.error ?? "Vrátenie zálohy zlyhalo.");
    load();
  }

  if (loading) return <p className="text-white/50">Načítavam...</p>;

  if (!eventId) {
    return <Card className="max-w-lg"><p>Neexistuje aktívny event.</p></Card>;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Skupiny</h1>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/40 border-b border-white/10">
              <th className="py-2 pr-4">Skupina</th>
              <th className="py-2 pr-4">Čas</th>
              <th className="py-2 pr-4">Režim</th>
              <th className="py-2 pr-4">Hráči</th>
              <th className="py-2 pr-4">Stav</th>
              <th className="py-2 pr-4">Záloha</th>
              <th className="py-2 pr-4">Akcie</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id} className="border-b border-white/5 align-top">
                <td className="py-3 pr-4 font-display font-bold">{formatGroupNumber(g.group_number)}</td>
                <td className="py-3 pr-4 text-white/60">{g.slot ? formatSlotTime(g.slot.start_time, g.slot.end_time) : "—"}</td>
                <td className="py-3 pr-4">{g.mode}</td>
                <td className="py-3 pr-4">{g.players.map((p) => p.name).join(", ") || g.player_count}</td>
                <td className="py-3 pr-4">{GROUP_STATUS_LABELS[g.status] ?? g.status}{g.arrived ? " · prišli" : ""}</td>
                <td className="py-3 pr-4">{g.payment ? PAYMENT_STATUS_LABELS[g.payment.status] ?? g.payment.status : "—"}</td>
                <td className="py-3 pr-4 space-x-1 space-y-1">
                  <Button size="md" variant="secondary" onClick={() => action(g.id, "mark_arrived")}>Prišli</Button>
                  <Button size="md" variant="ghost" onClick={() => action(g.id, "mark_no_show")}>Neprišiel</Button>
                  {g.payment?.method === "CASH" && g.payment.status === "WAITING_CASH" && (
                    <Button size="md" variant="success" onClick={() => action(g.id, "mark_paid_cash")}>Zaplatené cash</Button>
                  )}
                  {g.payment && !["REFUNDED", "REFUNDED_CASH", "FORFEITED"].includes(g.payment.status) && (
                    <Button size="md" variant="ghost" onClick={() => action(g.id, "mark_to_refund")}>Na vrátenie</Button>
                  )}
                  {g.payment && ["TO_REFUND", "PAID_ONLINE", "PAID_CASH"].includes(g.payment.status) && (
                    <Button size="md" variant="danger" onClick={() => refund(g.id)}>Vrátiť zálohu</Button>
                  )}
                  <Button size="md" variant="ghost" onClick={() => action(g.id, "cancel")}>Zrušiť</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
