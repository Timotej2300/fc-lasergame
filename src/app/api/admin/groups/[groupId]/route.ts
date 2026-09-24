import { NextResponse } from "next/server";
import { z } from "zod";
import { guardAdmin } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/server";
import { first } from "@/lib/supabase/safe";

const actionSchema = z.object({
  action: z.enum(["mark_arrived", "mark_not_arrived", "mark_no_show", "cancel", "mark_to_refund", "mark_paid_cash"])
});

export async function PATCH(req: Request, { params }: { params: { groupId: string } }) {
  const denied = await guardAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatná požiadavka." }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatná akcia." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: groupRows } = await supabase.from("groups").select("*").eq("id", params.groupId).limit(1);
  const group = first(groupRows);

  if (!group) {
    return NextResponse.json({ error: "Skupina nebola nájdená." }, { status: 404 });
  }

  const { data: paymentRows } = await supabase.from("payments").select("*").eq("group_id", group.id).limit(1);
  const payment = first(paymentRows);

  switch (parsed.data.action) {
    case "mark_arrived":
      await supabase.from("groups").update({ arrived: true }).eq("id", group.id);
      break;
    case "mark_not_arrived":
      await supabase.from("groups").update({ arrived: false }).eq("id", group.id);
      break;
    case "mark_no_show":
      await supabase.from("groups").update({ status: "NO_SHOW", arrived: false }).eq("id", group.id);
      if (payment && payment.status !== "REFUNDED" && payment.status !== "REFUNDED_CASH") {
        await supabase.from("payments").update({ status: "FORFEITED" }).eq("id", payment.id);
      }
      break;
    case "cancel":
      await supabase.from("groups").update({ status: "CANCELLED" }).eq("id", group.id);
      break;
    case "mark_to_refund":
      if (payment) {
        await supabase.from("payments").update({ status: "TO_REFUND" }).eq("id", payment.id);
      }
      break;
    case "mark_paid_cash":
      if (payment) {
        await supabase
          .from("payments")
          .update({ status: "PAID_CASH", paid_at: new Date().toISOString() })
          .eq("id", payment.id);
        await supabase.from("groups").update({ status: "CONFIRMED" }).eq("id", group.id);
      }
      break;
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: { groupId: string } }) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const supabase = createServiceClient();
  const { error } = await supabase.from("groups").delete().eq("id", params.groupId);

  if (error) {
    return NextResponse.json({ error: "Skupinu sa nepodarilo zmazať." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
