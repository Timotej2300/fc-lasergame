"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatGroupNumber, centsToEur, PAYMENT_STATUS_LABELS } from "@/lib/utils";

interface GroupRow {
  id: string;
  group_number: number;
  payment: { id: string; status: string; method: string; amount_cents: number } | null;
}

export default function AdminPlatbyPage() {
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const eventRes = await fetch("/api/admin/settings");
    const eventData = await eventRes.json();
    if (!eventData.event) {
      setLoading(false);
      return;
    }
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

  async function refund(groupId: string) {
    if (!confirm("Naozaj vrátiť zálohu?")) return;
    const res = await fetch(`/api/admin/groups/${groupId}/refund`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) alert(data.error ?? "Vrátenie zálohy zlyhalo.");
    load();
  }

  if (loading) return <p className="text-white/50">Načítavam...</p>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Platby / Zálohy</h1>
      <div className="space-y-3">
        {groups.filter((g) => g.payment).map((g) => (
          <Card key={g.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display font-bold">{formatGroupNumber(g.group_number)}</p>
              <p className="text-sm text-white/50">
                {centsToEur(g.payment!.amount_cents)} · {g.payment!.method} ·{" "}
                {PAYMENT_STATUS_LABELS[g.payment!.status] ?? g.payment!.status}
              </p>
            </div>
            {["TO_REFUND", "PAID_ONLINE", "PAID_CASH"].includes(g.payment!.status) && (
              <Button size="md" variant="danger" onClick={() => refund(g.id)}>Vrátiť zálohu</Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
