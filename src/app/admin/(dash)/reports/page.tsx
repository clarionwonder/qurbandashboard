import { requireAdmin } from "@/lib/auth";
import { rm } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { campaignStats } from "@/lib/stats";
import type { Campaign, PaymentMethod } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Reports({ searchParams }: { searchParams: Promise<{ campaign?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { t } = await getI18n();
  const A = t.admin;
  const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
  const campaigns = (data ?? []) as Campaign[];
  const current = campaigns.find((c) => c.id === sp.campaign) ?? campaigns[0];
  if (!current) return <p className="card text-stone-600">{A.noCampaigns}</p>;
  const s = await campaignStats(supabase, current.id);
  const progress = [s.animals.filling, s.animals.full, s.animals.slaughtered, s.animals.distributed];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">{A.reports}</h1>
        <form className="flex gap-2">
          <select name="campaign" defaultValue={current.id} className="input">
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <button className="btn-ghost">{A.show}</button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[[A.totalCollected, rm(s.collected)], [A.sharesSold, String(s.sharesSold)], [A.paidOrders, String(s.paidOrders)], [A.unpaid, String(s.pendingOrders + s.awaitingVerification)]].map(([k, v]) => (
          <div key={k} className="card"><p className="text-xs uppercase tracking-wide text-stone-500">{k}</p><p className="mt-1 text-2xl font-extrabold text-ink">{v}</p></div>
        ))}
      </div>

      <section className="card overflow-x-auto p-0">
        <h2 className="px-5 pt-5 font-bold text-ink">{A.byPackage}</h2>
        <table className="mt-3 w-full min-w-[560px]">
          <thead className="bg-sand-100"><tr><th className="th">{A.rc.pkg}</th><th className="th">{A.rc.animal}</th><th className="th text-right">{A.rc.sold}</th><th className="th text-right">{A.rc.animals}</th><th className="th text-right">{A.rc.collected}</th></tr></thead>
          <tbody>
            {s.byPackage.map((r) => (
              <tr key={r.pkg.id} className="border-t border-stone-100">
                <td className="td">{r.pkg.name}</td>
                <td className="td">{t.animal[r.pkg.animal_kind]}</td>
                <td className="td text-right">{r.shares}{r.pkg.max_animals ? ` / ${r.pkg.max_animals * r.pkg.shares_per_animal}` : ""}</td>
                <td className="td text-right">{r.animals}</td>
                <td className="td whitespace-nowrap text-right">{rm(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 font-bold text-ink">{A.byMethod}</h2>
          <ul className="grid gap-2 text-sm">
            {Object.entries(s.byMethod).map(([m, v]) => (
              <li key={m} className="flex justify-between gap-3"><span>{t.method[m as PaymentMethod]} ({v.orders})</span><b className="whitespace-nowrap">{rm(v.amount)}</b></li>
            ))}
            {Object.keys(s.byMethod).length === 0 && <li className="text-stone-500">{A.noPayments}</li>}
          </ul>
        </section>
        <section className="card">
          <h2 className="mb-3 font-bold text-ink">{A.progress}</h2>
          <ul className="grid gap-2 text-sm">
            {A.progressRows.map((k, i) => <li key={k} className="flex justify-between"><span>{k}</span><b>{progress[i]}</b></li>)}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`/admin/export?campaign=${current.id}&type=participants`} className="btn-ghost">{A.participantsCsv}</a>
            <a href={`/admin/export?campaign=${current.id}&type=orders`} className="btn-ghost">{A.ordersCsv}</a>
          </div>
        </section>
      </div>
    </div>
  );
}
