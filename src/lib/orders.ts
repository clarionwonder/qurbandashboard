import "server-only";
import { createServiceClient } from "./supabase/admin";
import type { Order, PaymentMethod } from "./types";
import type { Verification } from "./payments/types";

/** Record a verified gateway result and, if paid in full, allocate the shares. */
export async function applyVerification(provider: PaymentMethod, kind: string, v: Verification) {
  const db = createServiceClient();
  let order: Order | null = null;
  if (v.billId) {
    const { data } = await db.from("orders").select("*").eq("gateway_bill_id", v.billId).maybeSingle();
    order = data as Order | null;
  }
  if (!order && v.ref) {
    const { data } = await db.from("orders").select("*").eq("ref", v.ref).maybeSingle();
    order = data as Order | null;
  }
  await db.from("payment_events").insert({ order_id: order?.id ?? null, provider, kind, verified: v.verified, payload: v.raw });
  if (!order) return null;

  const amountOk = v.amount === undefined || Math.round(v.amount * 100) >= Math.round(Number(order.amount) * 100);
  if (v.verified && v.paid && amountOk && order.status !== "paid") {
    const { data, error } = await db.rpc("mark_order_paid", { p_order_id: order.id, p_method: provider, p_txn_id: v.txnId ?? null });
    if (error) throw error;
    return data as Order;
  }
  if (v.verified && !v.paid && order.status === "pending") {
    // leave as pending so the participant can retry; a failed attempt is logged in payment_events
  }
  return order;
}
