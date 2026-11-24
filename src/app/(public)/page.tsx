import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/admin";
import { dateMY } from "@/lib/format";
import type { Campaign } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = createServiceClient();
  const { data } = await db.from("campaigns").select("*").eq("status", "open").order("event_date", { ascending: true });
  const campaigns = (data ?? []) as Campaign[];

  return (
    <>
      <section className="bg-brand-800 text-white">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 md:grid-cols-[1.3fr_1fr] md:items-center">
          <div>
            <p className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-gold-500">
              Qurban · Aqiqah
            </p>
            <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">
              Sertai ibadah qurban bersama GERMY, dari tempahan hingga agihan daging.
            </h1>
            <p className="mt-4 max-w-xl text-brand-100">
              Pilih pakej, isi nama peserta untuk setiap bahagian dan bayar secara dalam talian. Anda boleh ikuti status
              penyembelihan dan muat turun sijil selepas selesai.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#kempen" className="btn-gold">Lihat kempen</a>
              <Link href="/semak" className="btn border border-white/30 text-white hover:bg-white/10">Semak tempahan</Link>
            </div>
          </div>
          <ol className="grid gap-3 text-sm">
            {[
              ["Pilih pakej", "Lembu, kambing atau unta, ikut bahagian."],
              ["Isi nama peserta", "Satu nama untuk setiap bahagian."],
              ["Bayar dalam talian", "FPX, kad, DuitNow atau pindahan bank."],
              ["Terima resit dan sijil", "Status dikemas kini selepas sembelihan."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-500 font-bold text-brand-900">{i + 1}</span>
                <span><b className="block">{t}</b><span className="text-brand-100">{d}</span></span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="kempen" className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold text-brand-900">Kempen dibuka</h2>
        {campaigns.length === 0 ? (
          <p className="card text-stone-600">Tiada kempen dibuka buat masa ini. Sila semak semula nanti.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {campaigns.map((c) => (
              <Link key={c.id} href={`/c/${c.slug}`} className="card group transition hover:border-brand-500 hover:shadow-md">
                <span className="badge bg-brand-50 uppercase text-brand-700">{c.type}</span>
                <h3 className="mt-2 text-lg font-bold text-brand-900 group-hover:text-brand-700">{c.title}</h3>
                <p className="mt-1 text-sm text-stone-600">
                  {c.location ?? "Lokasi akan dimaklumkan"}{c.event_date ? ` · ${dateMY(c.event_date)}` : ""}
                </p>
                {c.description && <p className="mt-3 line-clamp-2 text-sm text-stone-600">{c.description}</p>}
                <span className="mt-4 inline-block text-sm font-semibold text-brand-700">Tempah sekarang →</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
