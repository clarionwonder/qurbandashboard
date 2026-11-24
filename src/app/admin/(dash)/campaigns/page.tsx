import Link from "next/link";
import { Badge } from "@/components/Brand";
import { CampaignFields } from "@/components/CampaignFields";
import { requireAdmin } from "@/lib/auth";
import { dateMY, statusTone } from "@/lib/format";
import type { Campaign } from "@/lib/types";
import { createCampaign } from "../actions";

export const dynamic = "force-dynamic";

export default async function Campaigns() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
  const campaigns = (data ?? []) as Campaign[];
  return (
    <div className="grid gap-8">
      <section>
        <h1 className="mb-4 text-2xl font-bold text-brand-900">Campaigns</h1>
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead className="bg-sand-100"><tr><th className="th">Title</th><th className="th">Type</th><th className="th">Date</th><th className="th">Status</th><th className="th">Public link</th></tr></thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-t border-stone-100">
                  <td className="td"><Link href={`/admin/campaigns/${c.id}`} className="font-semibold text-brand-700 hover:underline">{c.title}</Link></td>
                  <td className="td capitalize">{c.type}</td>
                  <td className="td">{dateMY(c.event_date)}</td>
                  <td className="td"><Badge tone={statusTone[c.status]}>{c.status}</Badge></td>
                  <td className="td font-mono text-xs"><Link href={`/c/${c.slug}`} className="hover:underline" target="_blank">/c/{c.slug}</Link></td>
                </tr>
              ))}
              {campaigns.length === 0 && <tr><td className="td text-stone-500" colSpan={5}>No campaigns yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card">
        <h2 className="mb-4 text-lg font-bold text-brand-900">New campaign</h2>
        <form action={createCampaign} className="grid gap-4">
          <CampaignFields />
          <button className="btn-primary w-fit">Create campaign</button>
        </form>
      </section>
    </div>
  );
}
