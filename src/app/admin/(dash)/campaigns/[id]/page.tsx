import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Brand";
import { CampaignFields } from "@/components/CampaignFields";
import { requireAdmin } from "@/lib/auth";
import { siteUrl } from "@/lib/env";
import { rm, statusTone } from "@/lib/format";
import type { Dict } from "@/lib/i18n/dict";
import { getI18n } from "@/lib/i18n/server";
import type { Animal, AnimalStatus, Campaign, Package } from "@/lib/types";
import { savePackage, setAnimalNotes, setAnimalStatus, togglePackage, updateCampaign } from "../../actions";

export const dynamic = "force-dynamic";

const nextStatus: Partial<Record<AnimalStatus, AnimalStatus>> = { filling: "full", full: "slaughtered", slaughtered: "distributed" };

export default async function CampaignDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { t } = await getI18n();
  const A = t.admin;
  const [{ data: c }, { data: pk }, { data: an }, { data: sh }] = await Promise.all([
    supabase.from("campaigns").select("*").eq("id", id).maybeSingle(),
    supabase.from("packages").select("*").eq("campaign_id", id).order("sort_order").order("created_at"),
    supabase.from("animals").select("*").eq("campaign_id", id).order("seq"),
    supabase.from("shares").select("animal_id, slot, participant_name, order_id, animals!inner(campaign_id)").eq("animals.campaign_id", id),
  ]);
  if (!c) notFound();
  const campaign = c as Campaign;
  const packages = (pk ?? []) as Package[];
  const pkgIndex = (pid: string) => packages.findIndex((p) => p.id === pid);
  const animals = ((an ?? []) as Animal[]).sort((x, y) => pkgIndex(x.package_id) - pkgIndex(y.package_id) || x.seq - y.seq);
  const shares = (sh ?? []) as { animal_id: string; slot: number; participant_name: string; order_id: string }[];

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/campaigns" className="text-sm text-stone-500 hover:underline">← {A.campaigns}</Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-ink">{campaign.title}</h1>
            <Badge tone={statusTone[campaign.status]}>{t.campaignStatus[campaign.status]}</Badge>
          </div>
          <p className="break-all font-mono text-xs text-stone-500">{siteUrl}/c/{campaign.slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/orders?campaign=${id}`} className="btn-ghost">{A.orders}</Link>
          <a href={`/admin/export?campaign=${id}&type=participants`} className="btn-ghost">{A.exportParticipants}</a>
        </div>
      </div>

      <section className="card">
        <h2 className="mb-4 text-lg font-bold text-ink">{A.packages}</h2>
        <div className="grid gap-4">
          {packages.map((p) => (
            <details key={p.id} className="rounded-xl border border-stone-200 p-4">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{p.name} <span className="font-normal text-stone-500">· {A.pkgSummary(t.animal[p.animal_kind], p.shares_per_animal, rm(p.price_per_share), p.max_animals)}</span></span>
                {!p.active && <Badge tone="bg-stone-200 text-stone-700">{A.hidden}</Badge>}
              </summary>
              <form action={savePackage.bind(null, id, p.id)} className="mt-4"><PackageFields p={p} t={t} /><button className="btn-primary mt-3">{A.savePkg}</button></form>
              <form action={togglePackage.bind(null, id, p.id, !p.active)} className="mt-2"><button className="text-sm text-stone-600 underline">{p.active ? A.hidePkg : A.showPkg}</button></form>
            </details>
          ))}
          <details className="rounded-xl border border-dashed border-brand-200 p-4" open={packages.length === 0}>
            <summary className="cursor-pointer font-semibold text-accent">{A.addPkg}</summary>
            <form action={savePackage.bind(null, id, null)} className="mt-4"><PackageFields t={t} /><button className="btn-primary mt-3">{A.addPkgBtn}</button></form>
          </details>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-1 text-lg font-bold text-ink">{A.animalsTitle}</h2>
        <p className="mb-4 text-sm text-stone-500">{A.animalsHint}</p>
        {animals.length === 0 && <p className="text-sm text-stone-500">{A.noAnimals}</p>}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {animals.map((a) => {
            const p = packages.find((x) => x.id === a.package_id);
            const slots = shares.filter((s) => s.animal_id === a.id).sort((x, y) => x.slot - y.slot);
            const ns = nextStatus[a.status];
            return (
              <div key={a.id} className="rounded-xl border border-stone-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono font-bold">{a.code}</p>
                  <Badge tone={statusTone[a.status]}>{t.animalStatus[a.status]}</Badge>
                </div>
                <p className="text-xs text-stone-500">{p?.name} · {A.sharesOf(slots.length, p?.shares_per_animal ?? 0)}</p>
                <ol className="mt-2 grid gap-0.5 text-sm">
                  {Array.from({ length: p?.shares_per_animal ?? 0 }, (_, i) => {
                    const s = slots.find((x) => x.slot === i + 1);
                    return (
                      <li key={i} className={s ? "" : "text-stone-400"}>
                        {i + 1}. {s ? <Link href={`/admin/orders/${s.order_id}`} className="hover:underline">{s.participant_name}</Link> : A.empty}
                      </li>
                    );
                  })}
                </ol>
                <form action={setAnimalNotes.bind(null, id, a.id)} className="mt-2 flex gap-2">
                  <input name="notes" defaultValue={a.notes ?? ""} placeholder={A.notesPh} className="input py-1.5 text-xs" />
                  <button className="btn-ghost px-2 py-1 text-xs">{A.save}</button>
                </form>
                {ns && (
                  <form action={setAnimalStatus.bind(null, id, a.id, ns)} className="mt-2">
                    <button className="btn-primary w-full py-2 text-xs">{A.next[a.status]}</button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h2 className="mb-4 text-lg font-bold text-ink">{A.settings}</h2>
        <form action={updateCampaign.bind(null, id)} className="grid gap-4">
          <CampaignFields c={campaign} t={t} />
          <button className="btn-primary w-fit">{A.saveChanges}</button>
        </form>
      </section>
    </div>
  );
}

function PackageFields({ p, t }: { p?: Package; t: Dict }) {
  const F = t.admin.pf;
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <div className="md:col-span-2"><label className="label">{F.name}</label><input name="name" required defaultValue={p?.name} placeholder="Lembu tempatan" className="input" /></div>
      <div><label className="label">{F.animal}</label>
        <select name="animal_kind" defaultValue={p?.animal_kind ?? "cow"} className="input">
          {Object.entries(t.animal).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div><label className="label">{F.shares}</label><input name="shares_per_animal" type="number" min={1} max={7} required defaultValue={p?.shares_per_animal ?? 7} className="input" /></div>
      <div><label className="label">{F.price}</label><input name="price_per_share" type="number" step="0.01" min={0} required defaultValue={p?.price_per_share} className="input" /></div>
      <div><label className="label">{F.max}</label><input name="max_animals" type="number" min={1} defaultValue={p?.max_animals ?? ""} className="input" /></div>
      <div><label className="label">{F.prefix}</label><input name="code_prefix" required defaultValue={p?.code_prefix ?? "LMB"} className="input font-mono uppercase" /></div>
      <div><label className="label">{F.sort}</label><input name="sort_order" type="number" defaultValue={p?.sort_order ?? 0} className="input" /></div>
      <div className="md:col-span-4"><label className="label">{F.desc}</label><input name="description" defaultValue={p?.description ?? ""} className="input" /></div>
    </div>
  );
}
