import Link from "next/link";
import { Badge } from "@/components/Brand";
import { CampaignFields } from "@/components/CampaignFields";
import { requireAdmin } from "@/lib/auth";
import { statusTone } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import type { Campaign } from "@/lib/types";
import { createCampaign } from "../actions";

export const dynamic = "force-dynamic";

export default async function Campaigns() {
  const { supabase } = await requireAdmin();
  const { t, date } = await getI18n();
  const A = t.admin;
  const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
  const campaigns = (data ?? []) as Campaign[];
  return (
    <div className="grid gap-8">
      <section>
        <h1 className="mb-4 text-2xl font-bold text-ink">{A.campaigns}</h1>
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[640px]">
            <thead className="bg-sand-100"><tr><th className="th">{A.colTitle}</th><th className="th">{A.colType}</th><th className="th">{A.colDate}</th><th className="th">{A.colStatus}</th><th className="th">{A.colLink}</th></tr></thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-t border-stone-100">
                  <td className="td"><Link href={`/admin/campaigns/${c.id}`} className="font-semibold text-accent hover:underline">{c.title}</Link></td>
                  <td className="td capitalize">{c.type}</td>
                  <td className="td">{date(c.event_date)}</td>
                  <td className="td"><Badge tone={statusTone[c.status]}>{t.campaignStatus[c.status]}</Badge></td>
                  <td className="td font-mono text-xs"><Link href={`/c/${c.slug}`} className="hover:underline" target="_blank">/c/{c.slug}</Link></td>
                </tr>
              ))}
              {campaigns.length === 0 && <tr><td className="td text-stone-500" colSpan={5}>{A.noCampaigns}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card">
        <h2 className="mb-4 text-lg font-bold text-ink">{A.newCampaign}</h2>
        <form action={createCampaign} className="grid gap-4">
          <CampaignFields t={t} />
          <button className="btn-primary w-fit">{A.create}</button>
        </form>
      </section>
    </div>
  );
}
