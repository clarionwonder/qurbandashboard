import Link from "next/link";
import { Badge } from "@/components/Brand";
import { requireAdmin } from "@/lib/auth";
import { rm, statusTone } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { Campaign, Order, OrderStatus } from "@/lib/types";
import { approveOrder } from "../actions";

export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = ["pending", "awaiting_verification", "paid", "failed", "cancelled"];

export default async function Orders({ searchParams }: { searchParams: Promise<{ campaign?: string; status?: string; q?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { t, dateTime } = await getI18n();
  const A = t.admin;
  const { data: cs } = await supabase.from("campaigns").select("id, title").order("created_at", { ascending: false });
  const campaigns = (cs ?? []) as Pick<Campaign, "id" | "title">[];

  let q = supabase.from("orders").select("*, packages(name)").order("created_at", { ascending: false }).limit(500);
  if (sp.campaign) q = q.eq("campaign_id", sp.campaign);
  if (sp.status && STATUSES.includes(sp.status as OrderStatus)) q = q.eq("status", sp.status);
  if (sp.q) {
    const term = sp.q.replace(/[%,()]/g, "");
    q = q.or(`ref.ilike.%${term}%,buyer_name.ilike.%${term}%,buyer_phone.ilike.%${term}%,buyer_email.ilike.%${term}%`);
  }
  const { data } = await q;
  const orders = (data ?? []) as (Order & { packages: { name: string } })[];
  const exportQs = new URLSearchParams({ type: "orders", ...(sp.campaign ? { campaign: sp.campaign } : {}), ...(sp.status ? { status: sp.status } : {}) });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">{A.ordersTitle}</h1>
        <a href={`/admin/export?${exportQs}`} className="btn-ghost">{A.exportCsv}</a>
      </div>
      <form className="card mb-4 grid gap-3 md:grid-cols-[1fr_1fr_1.5fr_auto]">
        <select name="campaign" defaultValue={sp.campaign ?? ""} className="input">
          <option value="">{A.allCampaigns}</option>
          {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className="input">
          <option value="">{A.allStatuses}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{t.orderStatus[s]}</option>)}
        </select>
        <input name="q" defaultValue={sp.q ?? ""} placeholder={A.searchPh} className="input" />
        <button className="btn-primary">{A.filter}</button>
      </form>
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[900px]">
          <thead className="bg-sand-100"><tr>
            <th className="th">{A.oc.ref}</th><th className="th">{A.oc.buyer}</th><th className="th">{A.oc.pkg}</th><th className="th text-right">{A.oc.shares}</th>
            <th className="th text-right">{A.oc.amount}</th><th className="th">{A.oc.method}</th><th className="th">{A.oc.status}</th><th className="th">{A.oc.created}</th><th className="th"></th>
          </tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-stone-100">
                <td className="td font-mono"><Link href={`/admin/orders/${o.id}`} className="font-semibold text-accent hover:underline">{o.ref}</Link></td>
                <td className="td">{o.buyer_name}<br /><span className="text-xs text-stone-500">{o.buyer_phone}</span></td>
                <td className="td">{o.packages?.name}</td>
                <td className="td text-right">{o.quantity}</td>
                <td className="td whitespace-nowrap text-right">{rm(o.amount)}</td>
                <td className="td text-xs">{t.method[o.payment_method]}</td>
                <td className="td"><Badge tone={statusTone[o.status]}>{t.orderStatus[o.status]}</Badge></td>
                <td className="td whitespace-nowrap text-xs text-stone-500">{dateTime(o.created_at)}</td>
                <td className="td">
                  {o.status === "awaiting_verification" && (
                    <form action={approveOrder.bind(null, o.id)}><button className="btn-primary px-3 py-1.5 text-xs">{A.approve}</button></form>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td className="td text-stone-500" colSpan={9}>{A.noOrders}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
