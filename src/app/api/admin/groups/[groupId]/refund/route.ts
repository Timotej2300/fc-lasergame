import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import { first } from "@/lib/supabase/safe";

export async function POST(_req: Request, { params }: { params: { groupId: string } }) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const supabase = createServiceClient();
  const { data: paymentRows } = await supabase
    .from("payments")
    .select("*")
    .eq("group_id", params.groupId)
    .limit(1);

  const payment = first(paymentRows);

  if (!payment) {
    return NextResponse.json({ error: "Platba nebola nájdená." }, { status: 404 });
  }

  if (payment.status === "REFUNDED" || payment.status === "REFUNDED_CASH") {
    return NextResponse.json({ error: "Záloha už bola vrátená." }, { status: 400 });
  }

  if (payment.method === "CASH") {
    const { error } = await supabase
      .from("payments")
      .update({ status: "REFUNDED_CASH", refunded_at: new Date().toISOString() })
      .eq("id", payment.id);

    if (error) {
      return NextResponse.json({ error: "Vrátenie zálohy zlyhalo." }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: "REFUNDED_CASH" });
  }

  if (!payment.stripe_payment_intent_id) {
    return NextResponse.json({ error: "Platba nemá priradenú Stripe transakciu." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    await stripe.refunds.create({ payment_intent: payment.stripe_payment_intent_id });

    const { error } = await supabase
      .from("payments")
      .update({ status: "REFUNDED", refunded_at: new Date().toISOString() })
      .eq("id", payment.id);

    if (error) throw error;

    return NextResponse.json({ success: true, status: "REFUNDED" });
  } catch (err) {
    return NextResponse.json({ error: "Vrátenie zálohy cez Stripe zlyhalo." }, { status: 500 });
  }
}
