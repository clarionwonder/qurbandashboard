import type { Dict } from "@/lib/i18n/dict";
import type { Campaign } from "@/lib/types";

export function CampaignFields({ c, t }: { c?: Campaign; t: Dict }) {
  const F = t.admin.f;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="md:col-span-2"><label className="label">{F.title}</label><input name="title" required defaultValue={c?.title} placeholder="Qurban 1448H" className="input" /></div>
      <div><label className="label">{F.slug}</label><input name="slug" required defaultValue={c?.slug} placeholder="qurban-1448" pattern="[a-z0-9-]+" title={F.slugErr} className="input font-mono" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">{F.type}</label><select name="type" defaultValue={c?.type ?? "qurban"} className="input"><option value="qurban">Qurban</option><option value="aqiqah">Aqiqah</option></select></div>
        <div><label className="label">{F.status}</label>
          <select name="status" defaultValue={c?.status ?? "draft"} className="input">
            {(["draft", "open", "closed"] as const).map((s) => <option key={s} value={s}>{t.campaignStatus[s]}</option>)}
          </select>
        </div>
      </div>
      <div><label className="label">{F.location}</label><input name="location" defaultValue={c?.location ?? ""} className="input" /></div>
      <div><label className="label">{F.date}</label><input name="event_date" type="date" defaultValue={c?.event_date ?? ""} className="input" /></div>
      <div className="md:col-span-2"><label className="label">{F.desc}</label><textarea name="description" rows={3} defaultValue={c?.description ?? ""} className="input" /></div>
      <p className="text-sm font-semibold text-stone-700 md:col-span-2">{F.bankHint}</p>
      <div><label className="label">{F.bank}</label><input name="bank_name" defaultValue={c?.bank_name ?? ""} placeholder="Maybank" className="input" /></div>
      <div><label className="label">{F.accName}</label><input name="bank_account_name" defaultValue={c?.bank_account_name ?? ""} className="input" /></div>
      <div><label className="label">{F.accNo}</label><input name="bank_account_no" defaultValue={c?.bank_account_no ?? ""} className="input font-mono" /></div>
    </div>
  );
}
