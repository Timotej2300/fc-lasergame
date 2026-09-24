import { cx } from "@/lib/utils";

const colorMap: Record<string, string> = {
  ok: "bg-ok/15 text-ok border-ok/30",
  warn: "bg-warn/15 text-warn border-warn/30",
  danger: "bg-danger/15 text-danger border-danger/30",
  info: "bg-accent2/15 text-accent2 border-accent2/30",
  neutral: "bg-white/10 text-white/70 border-white/15"
};

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: keyof typeof colorMap }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border", colorMap[tone])}>
      {children}
    </span>
  );
}

const slotStatusTone: Record<string, keyof typeof colorMap> = {
  AVAILABLE: "ok",
  RESERVED: "warn",
  UNAVAILABLE: "neutral",
  IN_PROGRESS: "info",
  COMPLETED: "neutral"
};

export function SlotStatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    AVAILABLE: "Dostupné",
    RESERVED: "Rezervované",
    UNAVAILABLE: "Nedostupné",
    IN_PROGRESS: "Prebieha",
    COMPLETED: "Dokončené"
  };
  return <Badge tone={slotStatusTone[status] ?? "neutral"}>{labels[status] ?? status}</Badge>;
}
