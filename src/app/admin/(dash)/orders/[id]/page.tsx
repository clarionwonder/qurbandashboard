import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Brand";
import { requireAdmin } from "@/lib/auth";
import { animalStatusLabel, dateTimeMY, methodLabel, orderStatusLabel, rm, statusTone } from "@/lib/format";
import { getOrderView } from "@/lib/orderView";
import { approveOrder, cancelOrder, renameShare, saveOrderNotes } from "../../actions";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await requireAdmin();
  const view = await getOrderView(id);
  if (!view) notFound();
  const { order: o, campaign: c, pkg, shares } = view;
  const proofUrl = o.proof_path
    ? (await db.storage.from("payment-proofs").createSignedUrl(o.proof_path, 60 * 10)).data?.signedUrl
    : null;
  const { data: events } = await db.from("payment_events").select("*").eq("order_id", id).order("created_at", { ascending: false }).limit(20);

  return (
    <div className="grid gap-6">
      <div>
        <Link href={`/admin/orders?campaign=${c.id}`} className="text-sm text-stone-500 hover:underline">← Orders</Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-bold text-brand-900">{o.ref}</h1>
          <Badge tone={statusTone[o.status]}>{orderStatusLabel[o.status]}</Badge>
        </div>
        <p className="text-stone-600">{c.title} · {pkg.name}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card grid gap-1.5 text-sm">
          <h2 className="mb-2 font-bold text-brand-900">Buyer</h2>
          <p><b>{o.buyer_name}</b></p>
          <p><a href={`https://wa.me/${o.buyer_phone.replace(/^0/, "60").replace(/\D/g, "")}`} className="text-brand-700 underline" target="_blank">{o.buyer_phone}</a> · {o.buyer_email}</p>
          {o.buyer_address && <p className="text-stone-600">{o.buyer_address}</p>}
          <h2 className="mb-2 mt-4 font-bold text-brand-900">Payment</h2>
          <p>{o.quantity} × {rm(pkg.price_per_share)} = <b>{rm(o.amount)}</b></p>
          <p>{methodLabel[o.payment_method]}{o.gateway_txn_id ? ` · ${o.gateway_txn_id}` : ""}</p>
          <p className="text-stone-500">Created {dateTimeMY(o.created_at)}{o.paid_at ? ` · Paid ${dateTimeMY(o.paid_at)}` : ""}</p>
          {proofUrl && <a href={proofUrl} target="_blank" className="btn-ghost mt-2 w-fit">View transfer receipt</a>}
          <div className="mt-3 flex flex-wrap gap-2">
            {(o.status === "awaiting_verification" || o.status === "pending") && (
              <form action={approveOrder.bind(null, o.id)}><button className="btn-primary">{o.status === "pending" ? "Mark as paid" : "Approve payment"}</button></form>
            )}
            {o.status !== "paid" && o.status !== "cancelled" && (
              <form action={cancelOrder.bind(null, o.id)}><button className="btn-ghost text-rose-700">Cancel order</button></form>
            )}
            {o.status === "paid" && <Link href={`/order/${o.id}/receipt`} target="_blank" className="btn-ghost">Receipt</Link>}
            <Link href={`/order/${o.id}`} target="_blank" className="btn-ghost">Participant view</Link>
          </div>
        </section>

        <section className="card">
          <h2 className="mb-2 font-bold text-brand-900">Participants</h2>
          {o.status !== "paid" ? (
            <ol className="list-decimal pl-5 text-sm">{o.participants.map((n, i) => <li key={i}>{n}</li>)}</ol>
          ) : (
            <div className="grid gap-2">
              {shares.map((s) => (
                <form key={s.id} action={renameShare.bind(null, o.id, s.id)} className="flex items-center gap-2 text-sm">
                  <span className="w-24 shrink-0 font-mono text-xs">{s.animal.code} #{s.slot}</span>
                  <input name="participant_name" defaultValue={s.participant_name} className="input py-1.5" />
                  <Badge tone={statusTone[s.animal.status]}>{animalStatusLabel[s.animal.status]}</Badge>
                  <button className="btn-ghost px-2 py-1 text-xs">Save</button>
                </form>
              ))}
            </div>
          )}
          <form action={saveOrderNotes.bind(null, o.id)} className="mt-4 grid gap-2">
            <label className="label">Internal notes</label>
            <textarea name="admin_notes" rows={3} defaultValue={o.admin_notes ?? ""} className="input" />
            <button className="btn-ghost w-fit">Save notes</button>
          </form>
        </section>
      </div>

      {events && events.length > 0 && (
        <section className="card">
          <h2 className="mb-2 font-bold text-brand-900">Gateway log</h2>
          <ul className="grid gap-1 text-xs">
            {events.map((e) => (
              <li key={e.id} className="font-mono">{dateTimeMY(e.created_at)} · {e.provider} {e.kind} · {e.verified ? "verified" : "UNVERIFIED"}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
