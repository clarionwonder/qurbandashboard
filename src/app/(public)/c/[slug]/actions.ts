"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getPublicCampaign } from "@/lib/data";
import { getI18n } from "@/lib/i18n/server";
import { availableMethods } from "@/lib/payments";
import { createServiceClient } from "@/lib/supabase/admin";

const makeSchema = (e: { name: string; phone: string; email: string }) => z.object({
  slug: z.string(),
  package_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(50),
  participants: z.array(z.string().trim().max(120)),
  buyer_name: z.string().trim().min(2, e.name).max(120),
  buyer_phone: z.string().trim().regex(/^\+?[0-9\s-]{9,15}$/, e.phone),
  buyer_email: z.string().trim().email(e.email),
  buyer_address: z.string().trim().max(300).optional(),
  payment_method: z.enum(["billplz", "toyyibpay", "bayarcash", "senangpay", "manual", "demo"]),
});

export type BookingState = { error?: string };

export async function createOrder(_prev: BookingState, form: FormData): Promise<BookingState> {
  const { t } = await getI18n();
  const E = t.book.errors;
  const parsed = makeSchema(E).safeParse({
    slug: form.get("slug"),
    package_id: form.get("package_id"),
    quantity: form.get("quantity"),
    participants: form.getAll("participants"),
    buyer_name: form.get("buyer_name"),
    buyer_phone: form.get("buyer_phone"),
    buyer_email: form.get("buyer_email"),
    buyer_address: form.get("buyer_address") || undefined,
    payment_method: form.get("payment_method"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? E.incomplete };
  const d = parsed.data;

  const found = await getPublicCampaign(d.slug);
  if (!found || found.campaign.status !== "open") return { error: E.closed };
  const pkg = found.packages.find((p) => p.id === d.package_id);
  if (!pkg) return { error: E.noPackage };
  if (pkg.shares_remaining !== null && d.quantity > pkg.shares_remaining) {
    return { error: E.onlyLeft(Math.max(pkg.shares_remaining, 0)) };
  }
  const c = found.campaign;
  const methods = availableMethods(!!(c.bank_name && c.bank_account_no));
  if (!methods.includes(d.payment_method)) return { error: E.noMethod };

  const participants = Array.from({ length: d.quantity }, (_, i) => d.participants[i] || d.buyer_name);
  const amount = Number((pkg.price_per_share * d.quantity).toFixed(2));

  const db = createServiceClient();
  const { data: order, error } = await db
    .from("orders")
    .insert({
      campaign_id: c.id,
      package_id: pkg.id,
      buyer_name: d.buyer_name,
      buyer_phone: d.buyer_phone.replace(/[\s-]/g, ""),
      buyer_email: d.buyer_email.toLowerCase(),
      buyer_address: d.buyer_address ?? null,
      quantity: d.quantity,
      participants,
      amount,
      payment_method: d.payment_method,
    })
    .select("id")
    .single();
  if (error || !order) return { error: E.save };

  if (d.payment_method === "manual" || d.payment_method === "demo") redirect(`/order/${order.id}`);
  redirect(`/pay/${order.id}`);
}
