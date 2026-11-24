"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import type { AnimalStatus } from "@/lib/types";

const opt = (v: FormDataEntryValue | null) => (v === null || String(v).trim() === "" ? null : String(v).trim());

const campaignSchema = z.object({
  title: z.string().min(3),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers and dashes only"),
  type: z.enum(["qurban", "aqiqah"]),
  status: z.enum(["draft", "open", "closed"]),
  description: z.string().nullable(),
  location: z.string().nullable(),
  event_date: z.string().nullable(),
  bank_name: z.string().nullable(),
  bank_account_name: z.string().nullable(),
  bank_account_no: z.string().nullable(),
});

function readCampaign(f: FormData) {
  return campaignSchema.parse({
    title: String(f.get("title") ?? "").trim(),
    slug: String(f.get("slug") ?? "").trim().toLowerCase(),
    type: f.get("type") ?? "qurban",
    status: f.get("status") ?? "draft",
    description: opt(f.get("description")),
    location: opt(f.get("location")),
    event_date: opt(f.get("event_date")),
    bank_name: opt(f.get("bank_name")),
    bank_account_name: opt(f.get("bank_account_name")),
    bank_account_no: opt(f.get("bank_account_no")),
  });
}

export async function createCampaign(f: FormData) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("campaigns").insert(readCampaign(f)).select("id").single();
  if (error) throw new Error(error.message);
  redirect(`/admin/campaigns/${data.id}`);
}

export async function updateCampaign(id: string, f: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("campaigns").update(readCampaign(f)).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/campaigns/${id}`);
}

const packageSchema = z.object({
  name: z.string().min(2),
  description: z.string().nullable(),
  animal_kind: z.enum(["cow", "buffalo", "camel", "goat", "sheep"]),
  shares_per_animal: z.coerce.number().int().min(1).max(7),
  price_per_share: z.coerce.number().min(0),
  max_animals: z.coerce.number().int().positive().nullable(),
  code_prefix: z.string().min(1).max(6),
  sort_order: z.coerce.number().int(),
});

function readPackage(f: FormData) {
  return packageSchema.parse({
    name: String(f.get("name") ?? "").trim(),
    description: opt(f.get("description")),
    animal_kind: f.get("animal_kind"),
    shares_per_animal: f.get("shares_per_animal"),
    price_per_share: f.get("price_per_share"),
    max_animals: opt(f.get("max_animals")),
    code_prefix: String(f.get("code_prefix") ?? "A").trim().toUpperCase(),
    sort_order: f.get("sort_order") ?? 0,
  });
}

export async function savePackage(campaignId: string, packageId: string | null, f: FormData) {
  const { supabase } = await requireAdmin();
  const row = readPackage(f);
  const q = packageId
    ? supabase.from("packages").update(row).eq("id", packageId)
    : supabase.from("packages").insert({ ...row, campaign_id: campaignId });
  const { error } = await q;
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/campaigns/${campaignId}`);
}

export async function togglePackage(campaignId: string, packageId: string, active: boolean) {
  const { supabase } = await requireAdmin();
  await supabase.from("packages").update({ active }).eq("id", packageId);
  revalidatePath(`/admin/campaigns/${campaignId}`);
}

export async function setAnimalStatus(campaignId: string, animalId: string, status: AnimalStatus) {
  const { supabase } = await requireAdmin();
  const patch: Record<string, unknown> = { status };
  if (status === "slaughtered") patch.slaughtered_at = new Date().toISOString();
  if (status === "distributed") patch.distributed_at = new Date().toISOString();
  await supabase.from("animals").update(patch).eq("id", animalId);
  revalidatePath(`/admin/campaigns/${campaignId}`);
}

export async function setAnimalNotes(campaignId: string, animalId: string, f: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("animals").update({ notes: opt(f.get("notes")) }).eq("id", animalId);
  revalidatePath(`/admin/campaigns/${campaignId}`);
}

/** Approve a manual transfer (or record an offline payment) and allocate shares. */
export async function approveOrder(orderId: string) {
  const { db } = await requireAdmin();
  const { data: o } = await db.from("orders").select("payment_method").eq("id", orderId).single();
  const { error } = await db.rpc("mark_order_paid", { p_order_id: orderId, p_method: o?.payment_method ?? "manual", p_txn_id: null });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

export async function cancelOrder(orderId: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId).neq("status", "paid");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

export async function saveOrderNotes(orderId: string, f: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("orders").update({ admin_notes: opt(f.get("admin_notes")) }).eq("id", orderId);
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function renameShare(orderId: string, shareId: string, f: FormData) {
  const { supabase } = await requireAdmin();
  const name = String(f.get("participant_name") ?? "").trim();
  if (name) await supabase.from("shares").update({ participant_name: name }).eq("id", shareId);
  revalidatePath(`/admin/orders/${orderId}`);
}
