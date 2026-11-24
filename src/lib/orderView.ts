import "server-only";
import { createServiceClient } from "./supabase/admin";
import type { Animal, Campaign, Order, Package, Share } from "./types";

export interface OrderView {
  order: Order;
  campaign: Campaign;
  pkg: Package;
  shares: (Share & { animal: Animal })[];
}

export async function getOrderView(id: string): Promise<OrderView | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = createServiceClient();
  const { data: order } = await db.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) return null;
  const [{ data: campaign }, { data: pkg }, { data: shares }] = await Promise.all([
    db.from("campaigns").select("*").eq("id", order.campaign_id).single(),
    db.from("packages").select("*").eq("id", order.package_id).single(),
    db.from("shares").select("*, animal:animals(*)").eq("order_id", id).order("created_at"),
  ]);
  return { order: order as Order, campaign: campaign as Campaign, pkg: pkg as Package, shares: (shares ?? []) as OrderView["shares"] };
}
