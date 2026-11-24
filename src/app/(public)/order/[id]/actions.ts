"use server";

import { revalidatePath } from "next/cache";
import { getI18n } from "@/lib/i18n/server";
import { demoEnabled } from "@/lib/payments";
import { createServiceClient } from "@/lib/supabase/admin";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function uploadProof(orderId: string, _prev: { error?: string; ok?: boolean }, form: FormData) {
  const E = (await getI18n()).t.order.proofErr;
  const file = form.get("proof");
  if (!(file instanceof File) || file.size === 0) return { error: E.none };
  if (file.size > MAX_BYTES) return { error: E.big };
  if (!TYPES.includes(file.type)) return { error: E.type };

  const db = createServiceClient();
  const { data: order } = await db.from("orders").select("id, status, payment_method").eq("id", orderId).maybeSingle();
  if (!order || order.payment_method !== "manual" || !["pending", "awaiting_verification"].includes(order.status)) {
    return { error: E.notNeeded };
  }
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${orderId}/${Date.now()}.${ext}`;
  const { error } = await db.storage.from("payment-proofs").upload(path, file, { contentType: file.type });
  if (error) return { error: E.failed };
  await db.from("orders").update({ proof_path: path, status: "awaiting_verification" }).eq("id", orderId);
  revalidatePath(`/order/${orderId}`);
  return { ok: true };
}

/** Test-only shortcut, active only when ENABLE_DEMO_PAYMENT=true. */
export async function demoPay(orderId: string) {
  if (!demoEnabled()) return;
  const db = createServiceClient();
  await db.rpc("mark_order_paid", { p_order_id: orderId, p_method: "demo", p_txn_id: "DEMO" });
  revalidatePath(`/order/${orderId}`);
}
