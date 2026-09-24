import { centsToEur } from "@/lib/utils";

export function DepositNotice({ amountCents }: { amountCents: number }) {
  return (
    <div className="rounded-2xl border border-accent2/30 bg-accent2/10 p-4 text-sm text-accent2 flex gap-3">
      <span className="text-xl leading-none">ℹ️</span>
      <p>
        Táto platba nie je vstupné. Ide o vratnú zálohu {centsToEur(amountCents)}, ktorá vám bude po odohraní
        LaserGame vrátená.
      </p>
    </div>
  );
}
