import Link from "next/link";
import { Badge } from "@/components/Brand";
import { requireAdmin } from "@/lib/auth";
import { rm, statusTone } from "@/lib/format";
import { campaignStats } from "@/lib/stats";
import type { Campaign } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("campaigns").select("*").neq("status", "closed").order("created_at", { ascending: false });
  const campaigns = (data ?? []) as Campaign[];
  const stats = await Promise.all(campaigns.map((c) => campaignStats(supabase, c.id)));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">Overview</h1>
        <Link href="/admin/campaigns" className="btn-primary">New campaign</Link>
      </div>
      {campaigns.length === 0 && (
        <div className="card text-stone-600">No active campaigns yet. <Link href="/admin/campaigns" className="font-semibold text-brand-700 underline">Create your first campaign</Link>.</div>
      )}
      <div className="grid gap-6">
        {campaigns.map((c, i) => {
          const s = stats[i];
          return (
            <section key={c.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-brand-900">{c.title}</h2>
                  <Badge tone={statusTone[c.status]}>{c.status}</Badge>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/campaigns/${c.id}`} className="btn-ghost">Manage</Link>
                  <Link href={`/admin/orders?campaign=${c.id}`} className="btn-ghost">Orders</Link>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                <Stat label="Collected" value={rm(s.collected)} />
                <Stat label="Shares sold" value={String(s.sharesSold)} />
                <Stat label="Paid orders" value={String(s.paidOrders)} />
                <Stat label="To verify" value={String(s.awaitingVerification)} href={s.awaitingVerification ? `/admin/orders?campaign=${c.id}&status=awaiting_verification` : undefined} highlight={s.awaitingVerification > 0} />
                <Stat label="Animals" value={`${s.animals.filling + s.animals.full + s.animals.slaughtered + s.animals.distributed}`} sub={`${s.animals.full} full · ${s.animals.slaughtered + s.animals.distributed} done`} />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, sub, href, highlight }: { label: string; value: string; sub?: string; href?: string; highlight?: boolean }) {
  const body = (
    <div className={`rounded-xl p-3 ${highlight ? "bg-sky-50 ring-1 ring-sky-200" : "bg-sand-100"}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-brand-900">{value}</p>
      {sub && <p className="text-xs text-stone-500">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
