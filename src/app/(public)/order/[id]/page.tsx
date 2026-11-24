import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Brand";
import { animalLabel, animalStatusLabel, dateTimeMY, methodLabel, orderStatusMs, rm, statusTone } from "@/lib/format";
import { getOrderView } from "@/lib/orderView";
import { demoEnabled } from "@/lib/payments";
import { demoPay } from "./actions";
import { ProofForm } from "./ProofForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tempahan" };

const execMs: Record<string, string> = {
  filling: "Menunggu bahagian penuh",
  full: "Sedia untuk disembelih",
  slaughtered: "Telah disembelih",
  distributed: "Daging telah diagihkan",
};

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ err?: string }> }) {
  const { id } = await params;
  const { err } = await searchParams;
  const view = await getOrderView(id);
  if (!view) notFound();
  const { order: o, campaign: c, pkg, shares } = view;
  const done = shares.length > 0 && shares.every((s) => ["slaughtered", "distributed"].includes(s.animal.status));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm text-stone-500">No. tempahan</p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold text-brand-900">{o.ref}</h1>
        <Badge tone={statusTone[o.status]}>{orderStatusMs[o.status]}</Badge>
      </div>
      <p className="mt-1 text-stone-600">{c.title}</p>

      {err === "gateway" && (
        <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">Halaman bayaran tidak dapat dibuka. Sila cuba lagi atau hubungi penganjur.</p>
      )}

      <div className="card mt-6 grid gap-2 text-sm">
        <Row k="Pakej" v={`${pkg.name} (${animalLabel[pkg.animal_kind]})`} />
        <Row k="Bilangan bahagian" v={String(o.quantity)} />
        <Row k="Jumlah" v={rm(o.amount)} />
        <Row k="Kaedah bayaran" v={methodLabel[o.payment_method]} />
        <Row k="Penempah" v={`${o.buyer_name} · ${o.buyer_phone}`} />
        {o.paid_at && <Row k="Dibayar pada" v={dateTimeMY(o.paid_at)} />}
      </div>

      {o.status === "pending" && o.payment_method !== "manual" && o.payment_method !== "demo" && (
        <div className="card mt-4">
          <p className="text-sm text-stone-700">Bayaran belum diterima. Jika anda sudah membayar, status akan dikemas kini dalam beberapa minit.</p>
          <a href={`/pay/${o.id}`} className="btn-primary mt-3">Bayar sekarang</a>
        </div>
      )}

      {o.payment_method === "manual" && o.status !== "paid" && o.status !== "cancelled" && (
        <div className="card mt-4">
          <h2 className="font-bold text-brand-900">Pindahan bank</h2>
          <p className="mt-1 text-sm text-stone-600">Sila pindahkan <b>{rm(o.amount)}</b> dan letak <b>{o.ref}</b> sebagai rujukan.</p>
          <div className="mt-3 grid gap-1 rounded-xl bg-sand-100 p-3 text-sm">
            <Row k="Bank" v={c.bank_name ?? "-"} />
            <Row k="Nama akaun" v={c.bank_account_name ?? "-"} />
            <Row k="No. akaun" v={c.bank_account_no ?? "-"} />
          </div>
          {o.status === "awaiting_verification" ? (
            <p className="mt-3 text-sm text-sky-800">Resit anda telah diterima dan sedang disemak.</p>
          ) : null}
          <ProofForm orderId={o.id} />
        </div>
      )}

      {o.payment_method === "demo" && o.status === "pending" && demoEnabled() && (
        <form action={demoPay.bind(null, o.id)} className="card mt-4">
          <p className="text-sm text-stone-600">Mod ujian: tekan untuk menganggap tempahan ini telah dibayar.</p>
          <button className="btn-gold mt-3">Tandakan sebagai dibayar (demo)</button>
        </form>
      )}

      {o.status === "paid" && (
        <div className="card mt-4">
          <h2 className="font-bold text-brand-900">Bahagian anda</h2>
          <table className="mt-3 w-full">
            <thead><tr className="border-b border-stone-200"><th className="th">Haiwan</th><th className="th">Bahagian</th><th className="th">Nama peserta</th><th className="th">Status</th></tr></thead>
            <tbody>
              {shares.map((s) => (
                <tr key={s.id} className="border-b border-stone-100 last:border-0">
                  <td className="td font-mono">{s.animal.code}</td>
                  <td className="td">{s.slot}/{pkg.shares_per_animal}</td>
                  <td className="td">{s.participant_name}</td>
                  <td className="td"><Badge tone={statusTone[s.animal.status]}>{execMs[s.animal.status] ?? animalStatusLabel[s.animal.status]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/order/${o.id}/receipt`} className="btn-ghost">Resit</Link>
            {done && <Link href={`/order/${o.id}/certificate`} className="btn-primary">Sijil penyertaan</Link>}
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-stone-500">Simpan pautan halaman ini untuk menyemak status tempahan anda.</p>
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
