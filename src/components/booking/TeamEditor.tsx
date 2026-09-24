"use client";

import { Button } from "@/components/ui/Button";

export interface TeamDraft {
  name: string;
  playerNames: string[];
}

export function TeamEditor({
  teams,
  onChange,
  maxPlayers
}: {
  teams: TeamDraft[];
  onChange: (teams: TeamDraft[]) => void;
  maxPlayers: number;
}) {
  const totalPlayers = teams.reduce((sum, t) => sum + t.playerNames.length, 0);

  function addTeam() {
    onChange([...teams, { name: `TEAM ${teams.length + 1}`, playerNames: [""] }]);
  }

  function removeTeam(index: number) {
    if (teams.length <= 2) return;
    onChange(teams.filter((_, i) => i !== index));
  }

  function renameTeam(index: number, name: string) {
    const next = [...teams];
    next[index] = { ...next[index], name };
    onChange(next);
  }

  function addPlayer(teamIndex: number) {
    if (totalPlayers >= maxPlayers) return;
    const next = [...teams];
    next[teamIndex] = { ...next[teamIndex], playerNames: [...next[teamIndex].playerNames, ""] };
    onChange(next);
  }

  function updatePlayer(teamIndex: number, playerIndex: number, value: string) {
    const next = [...teams];
    const names = [...next[teamIndex].playerNames];
    names[playerIndex] = value;
    next[teamIndex] = { ...next[teamIndex], playerNames: names };
    onChange(next);
  }

  function removePlayer(teamIndex: number, playerIndex: number) {
    const next = [...teams];
    const names = next[teamIndex].playerNames.filter((_, i) => i !== playerIndex);
    next[teamIndex] = { ...next[teamIndex], playerNames: names.length > 0 ? names : [""] };
    onChange(next);
  }

  return (
    <div className="space-y-5">
      {teams.map((team, ti) => (
        <div key={ti} className="rounded-2xl border border-white/10 bg-panel2 p-4 space-y-3">
          <div className="flex gap-2 items-center">
            <input
              value={team.name}
              onChange={(e) => renameTeam(ti, e.target.value)}
              className="flex-1 rounded-lg bg-panel border border-white/10 px-3 py-2 font-display font-bold text-accent2"
            />
            <button
              type="button"
              onClick={() => removeTeam(ti)}
              disabled={teams.length <= 2}
              className="px-3 py-2 rounded-lg bg-panel border border-white/10 text-white/60 disabled:opacity-30"
            >
              ✕
            </button>
          </div>
          {team.playerNames.map((name, pi) => (
            <div key={pi} className="flex gap-2">
              <input
                value={name}
                onChange={(e) => updatePlayer(ti, pi, e.target.value)}
                placeholder={`Hráč ${pi + 1}`}
                className="flex-1 rounded-lg bg-panel border border-white/10 px-3 py-2 placeholder-white/30"
              />
              <button
                type="button"
                onClick={() => removePlayer(ti, pi)}
                className="px-3 rounded-lg bg-panel border border-white/10 text-white/60"
              >
                ✕
              </button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="md" onClick={() => addPlayer(ti)} disabled={totalPlayers >= maxPlayers}>
            + Pridať hráča do tímu
          </Button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="md" onClick={addTeam}>
        + Pridať tím
      </Button>
      <p className="text-xs text-white/40">Spolu hráčov: {totalPlayers} / {maxPlayers}</p>
    </div>
  );
}
