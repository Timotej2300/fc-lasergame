import { getActiveEvent } from "@/lib/data/events";
import { listSlotsForEvent } from "@/lib/data/slots";
import { NoActiveEvent } from "@/components/booking/NoActiveEvent";
import { BookingFlow } from "@/components/booking/BookingFlow";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const event = await getActiveEvent();

  if (!event) {
    return <NoActiveEvent />;
  }

  const slots = await listSlotsForEvent(event.id);

  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <BookingFlow event={event} initialSlots={slots} />
      </div>
    </main>
  );
}
