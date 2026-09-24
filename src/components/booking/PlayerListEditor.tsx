"use client";

import { Button } from "@/components/ui/Button";

export function PlayerListEditor({
  players,
  onChange,
  minPlayers,
  maxPlayers
}: {
  players: string[];
  onChange: (players: string[]) => void;
  minPlayers: number;
  maxPlayers: number;
}) {
  function updateAt(index: number, value: string) {
    const next = [...players];
    next[index] = value;
    onChange(next);
  }

  function addPlayer() {
    if (players.length >= maxPlayers) return;
    onChange([...players, ""]);
  }

  function removePlayer(index: number) {
    if (players.length <= 1) return;
    onChange(players.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {players.map((name, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={name}
            onChange={(e) => updateAt(i, e.target.value)}
            placeholder={`Hráč ${i + 1}`}
            className="flex-1 rounded-xl bg-panel2 border border-white/10 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={() => removePlayer(i)}
            disabled={players.length <= 1}
            className="px-3 rounded-xl bg-panel2 border border-white/10 text-white/60 disabled:opacity-30"
          >
            ✕
          </button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="md" onClick={addPlayer} disabled={players.length >= maxPlayers}>
        + Pridať hráča
      </Button>
      <p className="text-xs text-white/40">
        Minimum {minPlayers}, maximum {maxPlayers} hráčov.
      </p>
    </div>
  );
}
