import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Brand";
import { rm, statusTone } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { getOrderView } from "@/lib/orderView";
import { demoEnabled } from "@/lib/payments";
import { demoPay } from "./actions";
import { ProofForm } from "./ProofForm";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: (await getI18n()).t.order.title };
}

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ err?: string }> }) {
  const { id } = await params;
  const { err } = await searchParams;
  const { t, lang, dateTime } = await getI18n();
  const T = t.order;
  const view = await getOrderView(id);
  if (!view) notFound();
  const { order: o, campaign: c, pkg, shares } = view;
  const done = shares.length > 0 && shares.every((s) => ["slaughtered", "distributed"].includes(s.animal.status));
  const instr = T.bankInstr(rm(o.amount), o.ref);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm text-stone-500">{T.no}</p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold text-ink">{o.ref}</h1>
        <Badge tone={statusTone[o.status]}>{t.orderStatus[o.status]}</Badge>
      </div>
      <p className="mt-1 text-stone-600">{c.title}</p>

      {err === "gateway" && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{T.gatewayErr}</p>}

      <div className="card mt-6 grid gap-2 text-sm">
        <Row k={T.pkg} v={`${pkg.name} (${t.animal[pkg.animal_kind]})`} />
        <Row k={T.qty} v={String(o.quantity)} />
        <Row k={T.amount} v={rm(o.amount)} />
        <Row k={T.method} v={t.method[o.payment_method]} />
        <Row k={T.buyer} v={`${o.buyer_name} · ${o.buyer_phone}`} />
        {o.paid_at && <Row k={T.paidAt} v={dateTime(o.paid_at)} />}
      </div>

      {o.status === "pending" && o.payment_method !== "manual" && o.payment_method !== "demo" && (
        <div className="card mt-4">
          <p className="text-sm text-stone-700">{T.notPaid}</p>
          <a href={`/pay/${o.id}`} className="btn-primary mt-3">{T.payNow}</a>
        </div>
      )}

      {o.payment_method === "manual" && o.status !== "paid" && o.status !== "cancelled" && (
        <div className="card mt-4">
          <h2 className="font-bold text-ink">{T.bankTitle}</h2>
          <p className="mt-1 text-sm text-stone-600">{instr[0]}<b>{instr[1]}</b>{instr[2]}<b>{instr[3]}</b>{instr[4]}</p>
          <div className="mt-3 grid gap-1 rounded-xl bg-sand-100 p-3 text-sm">
            <Row k={T.bank} v={c.bank_name ?? "-"} />
            <Row k={T.accName} v={c.bank_account_name ?? "-"} />
            <Row k={T.accNo} v={c.bank_account_no ?? "-"} />
          </div>
          {o.status === "awaiting_verification" && <p className="mt-3 text-sm text-sky-800">{T.proofReceived}</p>}
          <ProofForm orderId={o.id} lang={lang} />
        </div>
      )}

      {o.payment_method === "demo" && o.status === "pending" && demoEnabled() && (
        <form action={demoPay.bind(null, o.id)} className="card mt-4">
          <p className="text-sm text-stone-600">{T.demoText}</p>
          <button className="btn-gold mt-3">{T.demoBtn}</button>
        </form>
      )}

      {o.status === "paid" && (
        <div className="card mt-4">
          <h2 className="font-bold text-ink">{T.yourShares}</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-stone-200"><th className="th">{T.colAnimal}</th><th className="th">{T.colShare}</th><th className="th">{T.colName}</th><th className="th">{T.colStatus}</th></tr></thead>
              <tbody>
                {shares.map((s) => (
                  <tr key={s.id} className="border-b border-stone-100 last:border-0">
                    <td className="td font-mono">{s.animal.code}</td>
                    <td className="td">{s.slot}/{pkg.shares_per_animal}</td>
                    <td className="td">{s.participant_name}</td>
                    <td className="td"><Badge tone={statusTone[s.animal.status]}>{t.execStatus[s.animal.status]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/order/${o.id}/receipt`} className="btn-ghost">{T.receipt}</Link>
            {done && <Link href={`/order/${o.id}/certificate`} className="btn-primary">{T.certificate}</Link>}
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-stone-500">{T.keepLink}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-stone-500">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
