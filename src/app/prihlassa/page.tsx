import { getActiveEvent } from "@/lib/data/events";
import { listSlotsForEvent } from "@/lib/data/slots";
import { NoActiveEvent } from "@/components/booking/NoActiveEvent";
import { KioskFlow } from "@/components/kiosk/KioskFlow";

export const dynamic = "force-dynamic";

export default async function KioskPage() {
  const event = await getActiveEvent();

  if (!event) {
    return <NoActiveEvent />;
  }

  const slots = await listSlotsForEvent(event.id);

  return (
    <main className="min-h-screen bg-bg px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <KioskFlow event={event} initialSlots={slots} />
      </div>
    </main>
  );
}
