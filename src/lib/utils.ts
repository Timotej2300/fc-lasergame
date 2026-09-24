import { format } from "date-fns";

export function formatGroupNumber(n: number): string {
  return `#${String(n).padStart(2, "0")}`;
}

export function formatSlotTime(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`;
}

export function formatEventDate(dateStr: string): string {
  return format(new Date(dateStr), "d. M. yyyy");
}

export function centsToEur(cents: number): string {
  return (cents / 100).toLocaleString("sk-SK", { style: "currency", currency: "EUR" });
}

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Čaká na platbu",
  PAID_ONLINE: "Zaplatená online",
  PAID_CASH: "Zaplatená v hotovosti",
  WAITING_CASH: "Čaká na hotovosť",
  TO_REFUND: "Na vrátenie",
  REFUNDED: "Vrátená",
  REFUNDED_CASH: "Vrátená v hotovosti",
  FAILED: "Platba zlyhala",
  FORFEITED: "Prepadnutá (neprišiel)"
};

export const GROUP_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Čaká na platbu",
  CONFIRMED: "Potvrdená",
  WAITING: "Čaká",
  CALLED: "Zavolaná",
  READY: "Pripravená",
  COUNTDOWN: "Odpočítavanie",
  PLAYING: "Hrá",
  FINISHED: "Dokončená",
  SKIPPED: "Preskočená",
  CANCELLED: "Zrušená",
  NO_SHOW: "Neprišiel"
};
