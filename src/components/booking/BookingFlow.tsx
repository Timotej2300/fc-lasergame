"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SlotPicker } from "@/components/booking/SlotPicker";
import { PlayerListEditor } from "@/components/booking/PlayerListEditor";
import { TeamEditor, type TeamDraft } from "@/components/booking/TeamEditor";
import { DepositNotice } from "@/components/booking/DepositNotice";
import { subscribeToEventChanges } from "@/lib/realtime";
import { formatEventDate, formatSlotTime, centsToEur } from "@/lib/utils";
import type { EventRow, GameSlotRow, BookingMode } from "@/types/database";

type Step = "slot" | "mode" | "players" | "contact" | "review";

export function BookingFlow({ event, initialSlots }: { event: EventRow; initialSlots: GameSlotRow[] }) {
  const router = useRouter();
  const [slots, setSlots] = useState(initialSlots);
  const [step, setStep] = useState<Step>("slot");
  const [selectedSlot, setSelectedSlot] = useState<GameSlotRow | null>(null);
  const [mode, setMode] = useState<BookingMode>("SOLO");
  const [players, setPlayers] = useState<string[]>(["", ""]);
  const [teams, setTeams] = useState<TeamDraft[]>([
    { name: "TEAM 1", playerNames: [""] },
    { name: "TEAM 2", playerNames: [""] }
  ]);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToEventChanges(event.id, async () => {
      const res = await fetch("/api/event/active", { cache: "no-store" });
      const data = await res.json();
      if (data.slots) setSlots(data.slots);
    });
    return unsubscribe;
  }, [event.id]);

  const totalPlayers = mode === "SOLO" ? players.filter((p) => p.trim()).length : teams.reduce((s, t) => s + t.playerNames.filter((p) => p.trim()).length, 0);

  function goToPlayers() {
    setError(null);
    if (!selectedSlot) {
      setError("Vyber si čas.");
      return;
    }
    setStep("mode");
  }

  function confirmMode() {
    setStep("players");
  }

  function goToContact() {
    setError(null);
    if (totalPlayers < event.min_players) {
      setError(`Minimálny počet hráčov je ${event.min_players}.`);
      return;
    }
    if (totalPlayers > event.max_players) {
      setError(`Maximálny počet hráčov je ${event.max_players}.`);
      return;
    }
    setStep("contact");
  }

  function goToReview() {
    setError(null);
    if (!contactName.trim() || !contactEmail.trim()) {
      setError("Vyplň meno a email.");
      return;
    }
    setStep("review");
  }

  async function submit() {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);

    const cleanPlayers = mode === "SOLO" ? players.filter((p) => p.trim()) : teams.flatMap((t) => t.playerNames.filter((p) => p.trim()));

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          slotId: selectedSlot.id,
          contactName,
          contactEmail,
          contactPhone: contactPhone || undefined,
          mode,
          source: "ONLINE",
          players: cleanPlayers,
          teams: mode === "TEAMS" ? teams.map((t) => ({ name: t.name, playerNames: t.playerNames.filter((p) => p.trim()) })) : undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Rezerváciu sa nepodarilo vytvoriť.");
        setSubmitting(false);
        return;
      }

      const checkoutRes = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: data.groupId })
      });
      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok || !checkoutData.url) {
        setError(checkoutData.error ?? "Platbu sa nepodarilo spustiť.");
        setSubmitting(false);
        return;
      }

      window.location.href = checkoutData.url;
    } catch {
      setError("Nastala chyba. Skús to znova.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <p className="text-accent2 font-display font-bold tracking-widest text-sm uppercase">{event.name}</p>
        <h1 className="font-display text-3xl font-black text-glow">LaserGame FaceClub</h1>
        <p className="text-white/60">
          {formatEventDate(event.event_date)} · {event.start_time.slice(0, 5)} – {event.end_time.slice(0, 5)}
        </p>
      </div>

      <Card>
        {step === "slot" && (
          <div className="space-y-5">
            <h2 className="font-display font-bold text-xl">1. Vyber si čas</h2>
            <SlotPicker slots={slots} selectedSlotId={selectedSlot?.id ?? null} onSelect={setSelectedSlot} />
            <Button size="lg" className="w-full" onClick={goToPlayers}>
              Pokračovať
            </Button>
          </div>
        )}

        {step === "mode" && (
          <div className="space-y-5">
            <h2 className="font-display font-bold text-xl">2. SOLO alebo TÍMY?</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMode("SOLO")}
                className={`rounded-2xl border p-6 font-display font-bold text-lg ${mode === "SOLO" ? "border-accent bg-accent/10" : "border-white/10 bg-panel2"}`}
              >
                SOLO
              </button>
              <button
                onClick={() => setMode("TEAMS")}
                className={`rounded-2xl border p-6 font-display font-bold text-lg ${mode === "TEAMS" ? "border-accent bg-accent/10" : "border-white/10 bg-panel2"}`}
              >
                TÍMY
              </button>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={() => setStep("slot")}>Späť</Button>
              <Button size="lg" className="flex-1" onClick={confirmMode}>Pokračovať</Button>
            </div>
          </div>
        )}

        {step === "players" && (
          <div className="space-y-5">
            <h2 className="font-display font-bold text-xl">3. Zadaj hráčov</h2>
            {mode === "SOLO" ? (
              <PlayerListEditor players={players} onChange={setPlayers} minPlayers={event.min_players} maxPlayers={event.max_players} />
            ) : (
              <TeamEditor teams={teams} onChange={setTeams} maxPlayers={event.max_players} />
            )}
            {error && <p className="text-danger text-sm">{error}</p>}
            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={() => setStep("mode")}>Späť</Button>
              <Button size="lg" className="flex-1" onClick={goToContact}>Pokračovať</Button>
            </div>
          </div>
        )}

        {step === "contact" && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl">4. Kontaktné údaje</h2>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Meno a priezvisko"
              className="w-full rounded-xl bg-panel2 border border-white/10 px-4 py-3 placeholder-white/30"
            />
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Email"
              type="email"
              className="w-full rounded-xl bg-panel2 border border-white/10 px-4 py-3 placeholder-white/30"
            />
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Telefón (voliteľné)"
              className="w-full rounded-xl bg-panel2 border border-white/10 px-4 py-3 placeholder-white/30"
            />
            {error && <p className="text-danger text-sm">{error}</p>}
            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={() => setStep("players")}>Späť</Button>
              <Button size="lg" className="flex-1" onClick={goToReview}>Pokračovať</Button>
            </div>
          </div>
        )}

        {step === "review" && selectedSlot && (
          <div className="space-y-5">
            <h2 className="font-display font-bold text-xl">5. Kontrola a záloha</h2>
            <div className="rounded-2xl bg-panel2 border border-white/10 p-4 space-y-2 text-sm">
              <p><span className="text-white/50">Čas:</span> {formatSlotTime(selectedSlot.start_time, selectedSlot.end_time)}</p>
              <p><span className="text-white/50">Režim:</span> {mode === "SOLO" ? "SOLO" : "TÍMY"}</p>
              <p><span className="text-white/50">Počet hráčov:</span> {totalPlayers}</p>
              <p><span className="text-white/50">Kontakt:</span> {contactName} · {contactEmail}</p>
            </div>
            <DepositNotice amountCents={event.deposit_amount_cents} />
            {error && <p className="text-danger text-sm">{error}</p>}
            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={() => setStep("contact")}>Späť</Button>
              <Button size="lg" className="flex-1" onClick={submit} disabled={submitting}>
                {submitting ? "Spracúvam..." : `Zaplatiť zálohu ${centsToEur(event.deposit_amount_cents)}`}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
