import { NextResponse } from "next/server";
import { z } from "zod";
import { capturePayPalOrder } from "@/lib/paypal/server";
import { markPaymentCapturedByOrder } from "@/lib/data/payments";

const bodySchema = z.object({ orderId: z.string().min(1) });

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

  try {
    const result = await capturePayPalOrder(parsed.data.orderId);

    if (result.status !== "COMPLETED") {
      return NextResponse.json({ error: "Platba nebola dokončená." }, { status: 400 });
    }

    const groupId = await markPaymentCapturedByOrder(parsed.data.orderId, result.captureId);

    return NextResponse.json({ success: true, groupId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Platbu sa nepodarilo potvrdiť. " + message }, { status: 500 });
  }
}
