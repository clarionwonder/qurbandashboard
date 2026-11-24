import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Brand";
import { CampaignFields } from "@/components/CampaignFields";
import { requireAdmin } from "@/lib/auth";
import { siteUrl } from "@/lib/env";
import { animalLabel, animalStatusLabel, rm, statusTone } from "@/lib/format";
import type { Animal, AnimalStatus, Campaign, Package } from "@/lib/types";
import { savePackage, setAnimalNotes, setAnimalStatus, togglePackage, updateCampaign } from "../../actions";

export const dynamic = "force-dynamic";

const nextStatus: Partial<Record<AnimalStatus, AnimalStatus>> = { filling: "full", full: "slaughtered", slaughtered: "distributed" };
const nextLabel: Partial<Record<AnimalStatus, string>> = { filling: "Close as full", full: "Mark slaughtered", slaughtered: "Mark distributed" };

export default async function CampaignDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
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
          <Link href="/admin/campaigns" className="text-sm text-stone-500 hover:underline">← Campaigns</Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-brand-900">{campaign.title}</h1>
            <Badge tone={statusTone[campaign.status]}>{campaign.status}</Badge>
          </div>
          <p className="font-mono text-xs text-stone-500">{siteUrl}/c/{campaign.slug}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/orders?campaign=${id}`} className="btn-ghost">Orders</Link>
          <a href={`/admin/export?campaign=${id}&type=participants`} className="btn-ghost">Export participants (CSV)</a>
        </div>
      </div>

      <section className="card">
        <h2 className="mb-4 text-lg font-bold text-brand-900">Packages</h2>
        <div className="grid gap-4">
          {packages.map((p) => (
            <details key={p.id} className="rounded-xl border border-stone-200 p-4">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{p.name} <span className="font-normal text-stone-500">· {animalLabel[p.animal_kind]} · {p.shares_per_animal} share(s) · {rm(p.price_per_share)}/share{p.max_animals ? ` · max ${p.max_animals} animals` : ""}</span></span>
                <span className="flex items-center gap-2">
                  {!p.active && <Badge tone="bg-stone-200 text-stone-700">hidden</Badge>}
                </span>
              </summary>
              <form action={savePackage.bind(null, id, p.id)} className="mt-4"><PackageFields p={p} /><button className="btn-primary mt-3">Save package</button></form>
              <form action={togglePackage.bind(null, id, p.id, !p.active)} className="mt-2"><button className="text-sm text-stone-600 underline">{p.active ? "Hide from booking page" : "Show on booking page"}</button></form>
            </details>
          ))}
          <details className="rounded-xl border border-dashed border-brand-200 p-4" open={packages.length === 0}>
            <summary className="cursor-pointer font-semibold text-brand-700">+ Add package</summary>
            <form action={savePackage.bind(null, id, null)} className="mt-4"><PackageFields /><button className="btn-primary mt-3">Add package</button></form>
          </details>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-1 text-lg font-bold text-brand-900">Animals</h2>
        <p className="mb-4 text-sm text-stone-500">Animals are created automatically as paid shares come in. Each one fills up before the next is opened.</p>
        {animals.length === 0 && <p className="text-sm text-stone-500">No animals yet. They appear after the first paid booking.</p>}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {animals.map((a) => {
            const p = packages.find((x) => x.id === a.package_id);
            const slots = shares.filter((s) => s.animal_id === a.id).sort((x, y) => x.slot - y.slot);
            const ns = nextStatus[a.status];
            return (
              <div key={a.id} className="rounded-xl border border-stone-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono font-bold">{a.code}</p>
                  <Badge tone={statusTone[a.status]}>{animalStatusLabel[a.status]}</Badge>
                </div>
                <p className="text-xs text-stone-500">{p?.name} · {slots.length}/{p?.shares_per_animal} shares</p>
                <ol className="mt-2 grid gap-0.5 text-sm">
                  {Array.from({ length: p?.shares_per_animal ?? 0 }, (_, i) => {
                    const s = slots.find((x) => x.slot === i + 1);
                    return (
                      <li key={i} className={s ? "" : "text-stone-400"}>
                        {i + 1}. {s ? <Link href={`/admin/orders/${s.order_id}`} className="hover:underline">{s.participant_name}</Link> : "empty"}
                      </li>
                    );
                  })}
                </ol>
                <form action={setAnimalNotes.bind(null, id, a.id)} className="mt-2 flex gap-2">
                  <input name="notes" defaultValue={a.notes ?? ""} placeholder="Notes (tag no., supplier)" className="input py-1.5 text-xs" />
                  <button className="btn-ghost px-2 py-1 text-xs">Save</button>
                </form>
                {ns && (
                  <form action={setAnimalStatus.bind(null, id, a.id, ns)} className="mt-2">
                    <button className="btn-primary w-full py-2 text-xs">{nextLabel[a.status]}</button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h2 className="mb-4 text-lg font-bold text-brand-900">Campaign settings</h2>
        <form action={updateCampaign.bind(null, id)} className="grid gap-4">
          <CampaignFields c={campaign} />
          <button className="btn-primary w-fit">Save changes</button>
        </form>
      </section>
    </div>
  );
}

function PackageFields({ p }: { p?: Package }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <div className="md:col-span-2"><label className="label">Name</label><input name="name" required defaultValue={p?.name} placeholder="Lembu tempatan" className="input" /></div>
      <div><label className="label">Animal</label>
        <select name="animal_kind" defaultValue={p?.animal_kind ?? "cow"} className="input">
          {Object.entries(animalLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div><label className="label">Shares per animal</label><input name="shares_per_animal" type="number" min={1} max={7} required defaultValue={p?.shares_per_animal ?? 7} className="input" /></div>
      <div><label className="label">Price per share (RM)</label><input name="price_per_share" type="number" step="0.01" min={0} required defaultValue={p?.price_per_share} className="input" /></div>
      <div><label className="label">Max animals (optional)</label><input name="max_animals" type="number" min={1} defaultValue={p?.max_animals ?? ""} className="input" /></div>
      <div><label className="label">Code prefix</label><input name="code_prefix" required defaultValue={p?.code_prefix ?? "LMB"} className="input font-mono uppercase" /></div>
      <div><label className="label">Sort order</label><input name="sort_order" type="number" defaultValue={p?.sort_order ?? 0} className="input" /></div>
      <div className="md:col-span-4"><label className="label">Description</label><input name="description" defaultValue={p?.description ?? ""} className="input" /></div>
    </div>
  );
}
