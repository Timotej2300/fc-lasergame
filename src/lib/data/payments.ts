import { createServiceClient } from "@/lib/supabase/server";
import { first } from "@/lib/supabase/safe";
import type { PaymentRow, PaymentStatus } from "@/types/database";

export async function getPaymentByGroup(groupId: string): Promise<PaymentRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("group_id", groupId)
    .limit(1);
  if (error) throw error;
  return first(data);
}

export async function getPaymentByCheckoutSession(sessionId: string): Promise<PaymentRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("stripe_checkout_session_id", sessionId)
    .limit(1);
  if (error) throw error;
  return first(data);
}

export async function attachCheckoutSession(paymentId: string, sessionId: string, paymentIntentId?: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("payments")
    .update({
      stripe_checkout_session_id: sessionId,
      stripe_payment_intent_id: paymentIntentId ?? null
    })
    .eq("id", paymentId);
  if (error) throw error;
}

export async function setPaymentStatus(paymentId: string, status: PaymentStatus, extra?: Record<string, unknown>) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("payments")
    .update({ status, ...extra })
    .eq("id", paymentId);
  if (error) throw error;
}

export async function markPaymentPaidByIntent(paymentIntentId: string, sessionId: string) {
  const supabase = createServiceClient();
  const { data: payments, error: findErr } = await supabase
    .from("payments")
    .select("id, group_id")
    .eq("stripe_checkout_session_id", sessionId)
    .limit(1);

  if (findErr) throw findErr;
  const payment = first(payments);
  if (!payment) return null;

  const { error } = await supabase
    .from("payments")
    .update({
      status: "PAID_ONLINE",
      stripe_payment_intent_id: paymentIntentId,
      paid_at: new Date().toISOString()
    })
    .eq("id", payment.id);

  if (error) throw error;

  await supabase.from("groups").update({ status: "CONFIRMED" }).eq("id", payment.group_id);

  return payment.group_id as string;
}
