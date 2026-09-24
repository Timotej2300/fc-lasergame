import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe/server";
import { getGroupById } from "@/lib/data/groups";
import { getPaymentByGroup, attachCheckoutSession } from "@/lib/data/payments";
import { getEventById } from "@/lib/data/events";

const bodySchema = z.object({ groupId: z.string().uuid() });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatná požiadavka." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatné údaje." }, { status: 400 });
  }

  const group = await getGroupById(parsed.data.groupId);
  if (!group) {
    return NextResponse.json({ error: "Skupina nebola nájdená." }, { status: 404 });
  }

  const payment = await getPaymentByGroup(group.id);
  if (!payment) {
    return NextResponse.json({ error: "Platba nebola nájdená." }, { status: 404 });
  }

  if (payment.status === "PAID_ONLINE") {
    return NextResponse.json({ error: "Táto rezervácia je už zaplatená." }, { status: 400 });
  }

  const event = await getEventById(group.event_id);
  if (!event) {
    return NextResponse.json({ error: "Event nebol nájdený." }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const stripe = getStripe();

  try {
    const line_items = process.env.STRIPE_PRICE_ID
      ? [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }]
      : [
          {
            price_data: {
              currency: "eur",
              unit_amount: payment.amount_cents,
              product_data: {
                name: "Vratná záloha 1 € na rezerváciu LaserGame – FaceClub",
                description:
                  "Táto platba nie je vstupné. Ide o vratnú zálohu, ktorá vám bude po odohraní LaserGame vrátená."
              }
            },
            quantity: 1
          }
        ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${appUrl}/rezervacia/${group.id}?status=success`,
      cancel_url: `${appUrl}/rezervacia/${group.id}?status=cancelled`,
      metadata: { groupId: group.id, paymentId: payment.id },
      payment_intent_data: {
        metadata: { groupId: group.id, paymentId: payment.id }
      }
    });

    await attachCheckoutSession(payment.id, session.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: "Platbu sa nepodarilo spustiť." }, { status: 500 });
  }
}
