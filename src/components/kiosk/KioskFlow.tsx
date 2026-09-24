"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatSlotTime, formatGroupNumber, centsToEur } from "@/lib/utils";
import { subscribeToEventChanges } from "@/lib/realtime";
import type { EventRow, GameSlotRow, BookingMode } from "@/types/database";

type Step = "intro" | "slot" | "mode" | "players" | "review" | "cash" | "done";

const AUTO_RETURN_MS = 12000;

export function KioskFlow({ event, initialSlots }: { event: EventRow; initialSlots: GameSlotRow[] }) {
  const [slots, setSlots] = useState(initialSlots);
  const [step, setStep] = useState<Step>("intro");
  const [selectedSlot, setSelectedSlot] = useState<GameSlotRow | null>(null);
  const [mode, setMode] = useState<BookingMode>("SOLO");
  const [players, setPlayers] = useState<string[]>(["", ""]);
  const [contactName, setContactName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [groupNumber, setGroupNumber] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToEventChanges(event.id, async () => {
      const res = await fetch("/api/event/active", { cache: "no-store" });
      const data = await res.json();
      if (data.slots) setSlots(data.slots);
    });
    return unsubscribe;
  }, [event.id]);

  useEffect(() => {
    if (step !== "done") return;
    const timer = setTimeout(resetAll, AUTO_RETURN_MS);
    return () => clearTimeout(timer);
  }, [step]);

  function resetAll() {
    setStep("intro");
    setSelectedSlot(null);
    setMode("SOLO");
    setPlayers(["", ""]);
    setContactName("");
    setError(null);
    setGroupNumber(null);
  }

  function updatePlayer(i: number, value: string) {
    const next = [...players];
    next[i] = value;
    setPlayers(next);
  }

  function addPlayer() {
    if (players.length >= event.max_players) return;
    setPlayers([...players, ""]);
  }

  function removePlayer(i: number) {
    if (players.length <= 1) return;
    setPlayers(players.filter((_, idx) => idx !== i));
  }

  const filledPlayers = players.filter((p) => p.trim());

  async function submit() {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          slotId: selectedSlot.id,
          contactName: contactName || filledPlayers[0] || "Skupina",
          contactEmail: `kiosk+${Date.now()}@faceclub.local`,
          mode,
          source: "KIOSK",
          players: filledPlayers
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Rezerváciu sa nepodarilo vytvoriť.");
        setSubmitting(false);
        return;
      }

      setGroupNumber(data.groupNumber);
      setStep("cash");
    } catch {
      setError("Nastala chyba. Skús to znova.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass rounded-[2.5rem] p-8 min-h-[600px] flex flex-col">
      {step === "intro" && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
          <div className="text-7xl">🎮</div>
          <h1 className="font-display text-4xl font-black">LaserGame FaceClub</h1>
          <p className="text-white/60 text-lg">{event.start_time.slice(0, 5)} – {event.end_time.slice(0, 5)}</p>
          <Button size="xl" onClick={() => setStep("slot")}>VYTVORIŤ SKUPINU</Button>
        </div>
      )}

      {step === "slot" && (
        <div className="flex-1 flex flex-col gap-6">
          <h2 className="font-display text-2xl font-bold text-center">Vyber čas</h2>
          <div className="grid grid-cols-3 gap-4 flex-1 content-start">
            {slots.map((slot) => {
              const disabled = slot.status !== "AVAILABLE";
              return (
                <button
                  key={slot.id}
                  disabled={disabled}
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-2xl border py-6 font-display font-bold text-xl disabled:opacity-25 ${
                    selectedSlot?.id === slot.id ? "bg-accent border-accent" : "bg-panel2 border-white/10"
                  }`}
                >
                  {formatSlotTime(slot.start_time, slot.end_time)}
                </button>
              );
            })}
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" size="xl" onClick={resetAll}>SPÄŤ</Button>
            <Button size="xl" className="flex-1" disabled={!selectedSlot} onClick={() => setStep("mode")}>
              ĎALEJ
            </Button>
          </div>
        </div>
      )}

      {step === "mode" && (
        <div className="flex-1 flex flex-col gap-6 justify-center">
          <h2 className="font-display text-2xl font-bold text-center">SOLO alebo TÍMY?</h2>
          <div className="grid grid-cols-2 gap-6">
            <button onClick={() => setMode("SOLO")} className={`rounded-2xl border py-12 font-display font-black text-3xl ${mode === "SOLO" ? "bg-accent border-accent" : "bg-panel2 border-white/10"}`}>SOLO</button>
            <button onClick={() => setMode("TEAMS")} className={`rounded-2xl border py-12 font-display font-black text-3xl ${mode === "TEAMS" ? "bg-accent border-accent" : "bg-panel2 border-white/10"}`}>TÍMY</button>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" size="xl" onClick={() => setStep("slot")}>SPÄŤ</Button>
            <Button size="xl" className="flex-1" onClick={() => setStep("players")}>ĎALEJ</Button>
          </div>
        </div>
      )}

      {step === "players" && (
        <div className="flex-1 flex flex-col gap-5">
          <h2 className="font-display text-2xl font-bold text-center">Zadaj hráčov</h2>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {players.map((name, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={name}
                  onChange={(e) => updatePlayer(i, e.target.value)}
                  placeholder={`Hráč ${i + 1}`}
                  className="flex-1 rounded-xl bg-panel2 border border-white/10 px-4 py-4 text-xl placeholder-white/30"
                />
                <button onClick={() => removePlayer(i)} className="px-4 rounded-xl bg-panel2 border border-white/10 text-2xl text-white/50">✕</button>
              </div>
            ))}
            <Button variant="secondary" size="lg" onClick={addPlayer} disabled={players.length >= event.max_players}>
              + Pridať hráča
            </Button>
          </div>
          {error && <p className="text-danger text-center">{error}</p>}
          <div className="flex gap-4">
            <Button variant="ghost" size="xl" onClick={() => setStep("mode")}>SPÄŤ</Button>
            <Button
              size="xl"
              className="flex-1"
              onClick={() => {
                if (filledPlayers.length < event.min_players) {
                  setError(`Minimálny počet hráčov je ${event.min_players}.`);
                  return;
                }
                if (filledPlayers.length > event.max_players) {
                  setError(`Maximálny počet hráčov je ${event.max_players}.`);
                  return;
                }
                setError(null);
                setStep("review");
              }}
            >
              ĎALEJ
            </Button>
          </div>
        </div>
      )}

      {step === "review" && selectedSlot && (
        <div className="flex-1 flex flex-col gap-5">
          <h2 className="font-display text-2xl font-bold text-center">Kontrola údajov</h2>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Meno skupiny (voliteľné)"
            className="rounded-xl bg-panel2 border border-white/10 px-4 py-4 text-xl placeholder-white/30"
          />
          <div className="rounded-2xl bg-panel2 border border-white/10 p-5 space-y-2 text-lg flex-1">
            <p>{formatSlotTime(selectedSlot.start_time, selectedSlot.end_time)}</p>
            <p>{mode === "SOLO" ? "SOLO" : "TÍMY"} · {filledPlayers.length} hráčov</p>
            <p className="text-accent2 font-bold">Záloha: {centsToEur(event.deposit_amount_cents)}</p>
          </div>
          {error && <p className="text-danger text-center">{error}</p>}
          <div className="flex gap-4">
            <Button variant="ghost" size="xl" onClick={() => setStep("players")}>SPÄŤ</Button>
            <Button size="xl" className="flex-1" onClick={submit} disabled={submitting}>
              {submitting ? "..." : "VYTVORIŤ REZERVÁCIU"}
            </Button>
          </div>
        </div>
      )}

      {step === "cash" && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
          <div className="text-6xl">💶</div>
          <h2 className="font-display text-3xl font-black">Zaplaťte {centsToEur(event.deposit_amount_cents)} pri bare</h2>
          <p className="text-white/60 text-lg">Vratná záloha. Personál ju po hre vráti v hotovosti.</p>
          <Button size="xl" onClick={() => setStep("done")}>POKRAČOVAŤ</Button>
        </div>
      )}

      {step === "done" && groupNumber !== null && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 animate-popIn">
          <div className="text-6xl">🎮</div>
          <h2 className="font-display text-2xl font-bold text-ok">REZERVÁCIA VYTVORENÁ</h2>
          <p className="font-display text-6xl font-black">{formatGroupNumber(groupNumber)}</p>
          <p className="text-white/50">Sledujte tabuľu poradia.</p>
        </div>
      )}
    </div>
  );
}
