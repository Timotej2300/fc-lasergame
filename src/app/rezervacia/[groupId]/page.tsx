"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { formatGroupNumber, formatSlotTime, centsToEur, PAYMENT_STATUS_LABELS } from "@/lib/utils";

interface GroupDetails {
  group: { group_number: number; status: string };
  players: { id: string; name: string }[];
  payment: { status: string; amount_cents: number } | null;
  slot: { start_time: string; end_time: string } | null;
}

export default function ReservationStatusPage() {
  const params = useParams<{ groupId: string }>();
  const search = useSearchParams();
  const status = search.get("status");
  const [details, setDetails] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let attempts = 0;
    let cancelled = false;

    async function maybeCapture() {
      const orderId = search.get("token");
      if (orderId) {
        try {
          await fetch("/api/paypal/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId })
          });
        } catch {
          // ignore, polling below will still show current status
        }
      }
    }

    async function poll() {
      attempts += 1;
      const res = await fetch(`/api/groups/${params.groupId}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (!cancelled) setDetails(data);
      }
      if (!cancelled) setLoading(false);
      if (!cancelled && attempts < 10 && status !== "cancelled") {
        setTimeout(poll, 2000);
      }
    }

    maybeCapture().then(poll);
    return () => {
      cancelled = true;
    };
  }, [params.groupId, status, search]);

  if (loading && !details) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-white/60">Načítavam...</p>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <Card className="text-center max-w-md">
          <p>Rezervácia nebola nájdená.</p>
        </Card>
      </main>
    );
  }

  const paid = details.payment?.status === "PAID_ONLINE";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <Card className="max-w-md w-full text-center space-y-5 animate-popIn">
        <div className="text-6xl">🎮</div>
        {paid ? (
          <h1 className="font-display text-2xl font-black text-ok">REZERVÁCIA POTVRDENÁ</h1>
        ) : status === "cancelled" ? (
          <h1 className="font-display text-2xl font-black text-warn">PLATBA NEBOLA DOKONČENÁ</h1>
        ) : (
          <h1 className="font-display text-2xl font-black text-warn">SPRACÚVAM PLATBU...</h1>
        )}

        <div className="rounded-2xl bg-panel2 border border-white/10 p-5 space-y-2 text-left text-sm">
          <p>
            <span className="text-white/50">Skupina:</span>{" "}
            <span className="font-display font-bold">{formatGroupNumber(details.group.group_number)}</span>
          </p>
          {details.slot && (
            <p>
              <span className="text-white/50">Čas:</span> {formatSlotTime(details.slot.start_time, details.slot.end_time)}
            </p>
          )}
          <div>
            <span className="text-white/50">Hráči:</span>
            <ul className="mt-1 space-y-0.5">
              {details.players.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          </div>
          {details.payment && (
            <p>
              <span className="text-white/50">Záloha:</span> {centsToEur(details.payment.amount_cents)} ·{" "}
              {PAYMENT_STATUS_LABELS[details.payment.status] ?? details.payment.status}
            </p>
          )}
        </div>

        <p className="text-xs text-white/50">Táto záloha vám bude po odohraní LaserGame vrátená.</p>

        <a href="/" className="inline-block px-6 py-3 rounded-xl bg-panel2 border border-white/10 font-display font-bold">
          SPÄŤ NA ÚVOD
        </a>
      </Card>
    </main>
  );
}
