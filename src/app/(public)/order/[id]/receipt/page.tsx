import { notFound } from "next/navigation";
import { Logo } from "@/components/Brand";
import { PrintButton } from "@/components/PrintButton";
import { animalLabel, dateTimeMY, methodLabel, rm } from "@/lib/format";
import { getOrderView } from "@/lib/orderView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resit" };

export default async function Receipt({ params }: { params: Promise<{ id: string }> }) {
  const view = await getOrderView((await params).id);
  if (!view || view.order.status !== "paid") notFound();
  const { order: o, campaign: c, pkg, shares } = view;
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-4 flex justify-end"><PrintButton /></div>
      <div className="rounded-2xl border border-stone-200 bg-white p-8">
        <div className="flex items-start justify-between">
          <Logo />
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-stone-500">Resit rasmi</p>
            <p className="font-mono text-lg font-bold">{o.ref}</p>
            <p className="text-sm text-stone-500">{dateTimeMY(o.paid_at)}</p>
          </div>
        </div>
        <hr className="my-6 border-stone-200" />
        <p className="text-sm text-stone-500">Diterima daripada</p>
        <p className="font-semibold">{o.buyer_name}</p>
        <p className="text-sm text-stone-600">{o.buyer_email} · {o.buyer_phone}</p>
        <table className="mt-6 w-full">
          <thead><tr className="border-b border-stone-200"><th className="th">Perkara</th><th className="th text-right">Kuantiti</th><th className="th text-right">Harga</th><th className="th text-right">Jumlah</th></tr></thead>
          <tbody>
            <tr className="border-b border-stone-100">
              <td className="td">{c.title}<br /><span className="text-stone-500">{pkg.name} ({animalLabel[pkg.animal_kind]})</span></td>
              <td className="td text-right">{o.quantity}</td>
              <td className="td text-right">{rm(pkg.price_per_share)}</td>
              <td className="td text-right font-semibold">{rm(o.amount)}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-4 text-right text-xl font-extrabold">{rm(o.amount)}</p>
        <p className="text-right text-sm text-stone-500">Dibayar melalui {methodLabel[o.payment_method]}{o.gateway_txn_id ? ` · Ruj. ${o.gateway_txn_id}` : ""}</p>
        <h3 className="mt-8 text-sm font-bold uppercase tracking-wide text-stone-500">Senarai peserta</h3>
        <ul className="mt-2 grid gap-1 text-sm">
          {shares.map((s) => <li key={s.id}>{s.animal.code} · Bahagian {s.slot}: <b>{s.participant_name}</b></li>)}
        </ul>
        <p className="mt-10 text-center text-xs text-stone-400">Resit ini dijana oleh komputer dan tidak memerlukan tandatangan.</p>
      </div>
    </div>
  );
}
