import "server-only";
import { createServiceClient } from "./supabase/admin";
import type { Campaign, Package } from "./types";

export interface PackageWithStock extends Package {
  shares_sold: number;
  shares_remaining: number | null;
}

/** Public read of a campaign plus live share counts (service role, since shares are admin-only under RLS). */
export async function getPublicCampaign(slug: string) {
  const db = createServiceClient();
  const { data: campaign } = await db.from("campaigns").select("*").eq("slug", slug).neq("status", "draft").maybeSingle();
  if (!campaign) return null;
  const { data: pkgs } = await db.from("packages").select("*").eq("campaign_id", campaign.id).eq("active", true).order("sort_order").order("created_at");
  const stock = await packageStock(campaign.id);
  const packages: PackageWithStock[] = (pkgs ?? []).map((p: Package) => {
    const sold = stock.get(p.id) ?? 0;
    return { ...p, shares_sold: sold, shares_remaining: p.max_animals ? p.max_animals * p.shares_per_animal - sold : null };
  });
  return { campaign: campaign as Campaign, packages };
}

/** Shares already allocated (paid) plus shares held by orders still waiting for payment, per package. */
export async function packageStock(campaignId: string) {
  const db = createServiceClient();
  const { data: orders } = await db
    .from("orders")
    .select("package_id, quantity, status, created_at")
    .eq("campaign_id", campaignId)
    .in("status", ["paid", "awaiting_verification", "pending"]);
  const holdMs = 30 * 60 * 1000; // unpaid gateway orders hold stock for 30 minutes
  const map = new Map<string, number>();
  for (const o of orders ?? []) {
    if (o.status === "pending" && Date.now() - new Date(o.created_at).getTime() > holdMs) continue;
    map.set(o.package_id, (map.get(o.package_id) ?? 0) + o.quantity);
  }
  return map;
}
