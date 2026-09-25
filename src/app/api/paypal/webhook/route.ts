import { NextResponse } from "next/server";
import { verifyPayPalWebhook, capturePayPalOrder } from "@/lib/paypal/server";
import { markPaymentCapturedByOrder, setPaymentStatus } from "@/lib/data/payments";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const rawBody = await req.text();

  if (webhookId) {
    const valid = await verifyPayPalWebhook(req.headers, rawBody, webhookId).catch(() => false);
    if (!valid) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  try {
    switch (event.event_type) {
      case "CHECKOUT.ORDER.APPROVED": {
        const orderId = event.resource?.id;
        if (orderId) {
          const result = await capturePayPalOrder(orderId).catch(() => null);
          if (result && result.status === "COMPLETED") {
            await markPaymentCapturedByOrder(orderId, result.captureId);
          }
        }
        break;
      }
      case "PAYMENT.CAPTURE.REFUNDED": {
        const captureId = event.resource?.id;
        if (captureId) {
          const supabase = createServiceClient();
          const { data: rows } = await supabase
            .from("payments")
            .select("id")
            .eq("paypal_capture_id", captureId)
            .limit(1);
          const payment = rows?.[0];
          if (payment) {
            await setPaymentStatus(payment.id, "REFUNDED", { refunded_at: new Date().toISOString() });
          }
        }
        break;
      }
      default:
        break;
    }
  } catch {
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
