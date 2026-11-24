import type { Campaign } from "@/lib/types";

export function CampaignFields({ c }: { c?: Campaign }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="md:col-span-2"><label className="label">Title</label><input name="title" required defaultValue={c?.title} placeholder="Qurban 1448H" className="input" /></div>
      <div><label className="label">Link slug</label><input name="slug" required defaultValue={c?.slug} placeholder="qurban-1448" className="input font-mono" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Type</label><select name="type" defaultValue={c?.type ?? "qurban"} className="input"><option value="qurban">Qurban</option><option value="aqiqah">Aqiqah</option></select></div>
        <div><label className="label">Status</label><select name="status" defaultValue={c?.status ?? "draft"} className="input"><option value="draft">Draft</option><option value="open">Open</option><option value="closed">Closed</option></select></div>
      </div>
      <div><label className="label">Location</label><input name="location" defaultValue={c?.location ?? ""} className="input" /></div>
      <div><label className="label">Slaughter / event date</label><input name="event_date" type="date" defaultValue={c?.event_date ?? ""} className="input" /></div>
      <div className="md:col-span-2"><label className="label">Description (shown to participants)</label><textarea name="description" rows={3} defaultValue={c?.description ?? ""} className="input" /></div>
      <p className="text-sm font-semibold text-stone-700 md:col-span-2">Bank details for manual transfer (leave empty to hide that option)</p>
      <div><label className="label">Bank</label><input name="bank_name" defaultValue={c?.bank_name ?? ""} placeholder="Maybank" className="input" /></div>
      <div><label className="label">Account name</label><input name="bank_account_name" defaultValue={c?.bank_account_name ?? ""} className="input" /></div>
      <div><label className="label">Account number</label><input name="bank_account_no" defaultValue={c?.bank_account_no ?? ""} className="input font-mono" /></div>
    </div>
  );
}
