import { NextResponse } from "next/server";
import { z } from "zod";
import { createPayPalOrder } from "@/lib/paypal/server";
import { getGroupById } from "@/lib/data/groups";
import { getPaymentByGroup, attachPayPalOrder } from "@/lib/data/payments";
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

  try {
    const order = await createPayPalOrder({
      amountCents: payment.amount_cents,
      groupId: group.id,
      paymentId: payment.id,
      returnUrl: `${appUrl}/rezervacia/${group.id}?paypal=return`,
      cancelUrl: `${appUrl}/rezervacia/${group.id}?status=cancelled`
    });

    await attachPayPalOrder(payment.id, order.id);

    return NextResponse.json({ url: order.approveUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Platbu sa nepodarilo spustiť. " + message }, { status: 500 });
  }
}
