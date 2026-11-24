import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Animal, Order, Package } from "./types";

export interface CampaignStats {
  collected: number;
  paidOrders: number;
  sharesSold: number;
  pendingOrders: number;
  awaitingVerification: number;
  animals: Record<string, number>;
  byPackage: { pkg: Package; shares: number; amount: number; animals: number }[];
  byMethod: Record<string, { orders: number; amount: number }>;
}

export async function campaignStats(db: SupabaseClient, campaignId: string): Promise<CampaignStats> {
  const [{ data: orders }, { data: pkgs }, { data: animals }] = await Promise.all([
    db.from("orders").select("id, package_id, quantity, amount, status, payment_method").eq("campaign_id", campaignId),
    db.from("packages").select("*").eq("campaign_id", campaignId).order("sort_order"),
    db.from("animals").select("id, package_id, status").eq("campaign_id", campaignId),
  ]);
  const os = (orders ?? []) as Order[];
  const paid = os.filter((o) => o.status === "paid");
  const animalsBy: Record<string, number> = { filling: 0, full: 0, slaughtered: 0, distributed: 0 };
  for (const a of (animals ?? []) as Animal[]) animalsBy[a.status]++;
  const byMethod: CampaignStats["byMethod"] = {};
  for (const o of paid) {
    byMethod[o.payment_method] ??= { orders: 0, amount: 0 };
    byMethod[o.payment_method].orders++;
    byMethod[o.payment_method].amount += Number(o.amount);
  }
  return {
    collected: paid.reduce((s, o) => s + Number(o.amount), 0),
    paidOrders: paid.length,
    sharesSold: paid.reduce((s, o) => s + o.quantity, 0),
    pendingOrders: os.filter((o) => o.status === "pending").length,
    awaitingVerification: os.filter((o) => o.status === "awaiting_verification").length,
    animals: animalsBy,
    byPackage: ((pkgs ?? []) as Package[]).map((pkg) => {
      const po = paid.filter((o) => o.package_id === pkg.id);
      return {
        pkg,
        shares: po.reduce((s, o) => s + o.quantity, 0),
        amount: po.reduce((s, o) => s + Number(o.amount), 0),
        animals: ((animals ?? []) as Animal[]).filter((a) => a.package_id === pkg.id).length,
      };
    }),
    byMethod,
  };
}
