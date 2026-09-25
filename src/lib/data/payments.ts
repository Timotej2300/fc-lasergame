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

export async function getPaymentByOrderId(orderId: string): Promise<PaymentRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("paypal_order_id", orderId)
    .limit(1);
  if (error) throw error;
  return first(data);
}

export async function attachPayPalOrder(paymentId: string, orderId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("payments")
    .update({ paypal_order_id: orderId })
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

export async function markPaymentCapturedByOrder(orderId: string, captureId: string | null) {
  const supabase = createServiceClient();
  const { data: rows, error: findErr } = await supabase
    .from("payments")
    .select("id, group_id, status")
    .eq("paypal_order_id", orderId)
    .limit(1);

  if (findErr) throw findErr;
  const payment = first(rows);
  if (!payment) return null;

  if (payment.status === "PAID_ONLINE") {
    return payment.group_id as string;
  }

  const { error } = await supabase
    .from("payments")
    .update({
      status: "PAID_ONLINE",
      paypal_capture_id: captureId,
      paid_at: new Date().toISOString()
    })
    .eq("id", payment.id);

  if (error) throw error;

  await supabase.from("groups").update({ status: "CONFIRMED" }).eq("id", payment.group_id);

  return payment.group_id as string;
}
