import { notFound } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { getI18n } from "@/lib/i18n/server";
import { getOrderView } from "@/lib/orderView";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: (await getI18n()).t.cert.title };
}

export default async function Certificate({ params }: { params: Promise<{ id: string }> }) {
  const { t, date } = await getI18n();
  const C = t.cert;
  const view = await getOrderView((await params).id);
  if (!view || view.order.status !== "paid") notFound();
  const { campaign: c, pkg, shares } = view;
  const done = shares.filter((s) => ["slaughtered", "distributed"].includes(s.animal.status));
  if (done.length === 0) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-4 flex justify-end"><PrintButton label={t.print} /></div>
      {done.map((s) => (
        <section key={s.id} className="mb-8 break-after-page rounded-3xl border-[10px] border-double border-brand-700 bg-surface p-8 text-center sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold-600">GERMY {c.type === "aqiqah" ? "Aqiqah" : "Qurban"}</p>
          <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">{C.title}</h1>
          <p className="mt-6 text-stone-600">{C.certify(c.type)}</p>
          <p className="mt-3 text-2xl font-bold text-accent sm:text-3xl">{s.participant_name}</p>
          <p className="mx-auto mt-6 max-w-xl text-stone-600">
            {C.body(c.title, `${s.slot}/${pkg.shares_per_animal}`, t.animal[pkg.animal_kind].toLowerCase(), s.animal.code, s.animal.slaughtered_at ? date(s.animal.slaughtered_at) : "", c.location ?? "")}
          </p>
          <p className="mt-8 text-sm italic text-stone-500">{C.prayer}</p>
        </section>
      ))}
    </div>
  );
}
