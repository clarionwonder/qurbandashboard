import { notFound } from "next/navigation";
import { Logo } from "@/components/Brand";
import { PrintButton } from "@/components/PrintButton";
import { rm } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { getOrderView } from "@/lib/orderView";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: (await getI18n()).t.receipt.title };
}

export default async function Receipt({ params }: { params: Promise<{ id: string }> }) {
  const { t, dateTime } = await getI18n();
  const R = t.receipt;
  const view = await getOrderView((await params).id);
  if (!view || view.order.status !== "paid") notFound();
  const { order: o, campaign: c, pkg, shares } = view;
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-4 flex justify-end"><PrintButton label={t.print} /></div>
      <div className="rounded-2xl border border-stone-200 bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <Logo />
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-stone-500">{R.official}</p>
            <p className="font-mono text-lg font-bold">{o.ref}</p>
            <p className="text-sm text-stone-500">{dateTime(o.paid_at)}</p>
          </div>
        </div>
        <hr className="my-6 border-stone-200" />
        <p className="text-sm text-stone-500">{R.from}</p>
        <p className="font-semibold">{o.buyer_name}</p>
        <p className="text-sm text-stone-600">{o.buyer_email} · {o.buyer_phone}</p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-stone-200"><th className="th">{R.item}</th><th className="th text-right">{R.qty}</th><th className="th text-right">{R.price}</th><th className="th text-right">{R.total}</th></tr></thead>
            <tbody>
              <tr className="border-b border-stone-100">
                <td className="td">{c.title}<br /><span className="text-stone-500">{pkg.name} ({t.animal[pkg.animal_kind]})</span></td>
                <td className="td text-right">{o.quantity}</td>
                <td className="td whitespace-nowrap text-right">{rm(pkg.price_per_share)}</td>
                <td className="td whitespace-nowrap text-right font-semibold">{rm(o.amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-right text-xl font-extrabold">{rm(o.amount)}</p>
        <p className="text-right text-sm text-stone-500">{R.paidVia(t.method[o.payment_method])}{o.gateway_txn_id ? ` · ${R.ref} ${o.gateway_txn_id}` : ""}</p>
        <h3 className="mt-8 text-sm font-bold uppercase tracking-wide text-stone-500">{R.participants}</h3>
        <ul className="mt-2 grid gap-1 text-sm">
          {shares.map((s) => <li key={s.id}>{s.animal.code} · {R.share} {s.slot}: <b>{s.participant_name}</b></li>)}
        </ul>
        <p className="mt-10 text-center text-xs text-stone-400">{R.footer}</p>
      </div>
    </div>
  );
}
