"use client";

import { formatSlotTime, cx } from "@/lib/utils";
import type { GameSlotRow } from "@/types/database";

export function SlotPicker({
  slots,
  selectedSlotId,
  onSelect
}: {
  slots: GameSlotRow[];
  selectedSlotId: string | null;
  onSelect: (slot: GameSlotRow) => void;
}) {
  if (slots.length === 0) {
    return <p className="text-white/60">Pre tento event zatiaľ nie sú vytvorené žiadne časové sloty.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {slots.map((slot) => {
        const disabled = slot.status !== "AVAILABLE";
        const selected = slot.id === selectedSlotId;
        return (
          <button
            key={slot.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(slot)}
            className={cx(
              "rounded-2xl border px-3 py-4 font-display font-bold text-lg transition disabled:opacity-30 disabled:cursor-not-allowed",
              selected
                ? "bg-accent border-accent text-white shadow-lg shadow-accent/30"
                : "bg-panel2 border-white/10 hover:border-accent2/50 text-white"
            )}
          >
            {formatSlotTime(slot.start_time, slot.end_time)}
          </button>
        );
      })}
    </div>
  );
}
