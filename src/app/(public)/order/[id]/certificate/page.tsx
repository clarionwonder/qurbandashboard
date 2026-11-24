import { notFound } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { animalLabel, dateMY } from "@/lib/format";
import { getOrderView } from "@/lib/orderView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sijil penyertaan" };

export default async function Certificate({ params }: { params: Promise<{ id: string }> }) {
  const view = await getOrderView((await params).id);
  if (!view || view.order.status !== "paid") notFound();
  const { campaign: c, pkg, shares } = view;
  const done = shares.filter((s) => ["slaughtered", "distributed"].includes(s.animal.status));
  if (done.length === 0) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-4 flex justify-end"><PrintButton /></div>
      {done.map((s) => (
        <section key={s.id} className="mb-8 break-after-page rounded-3xl border-[10px] border-double border-brand-700 bg-white p-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold-600">GERMY {c.type === "aqiqah" ? "Aqiqah" : "Qurban"}</p>
          <h1 className="mt-4 text-4xl font-extrabold text-brand-900">Sijil Penyertaan</h1>
          <p className="mt-6 text-stone-600">Dengan ini disahkan bahawa ibadah {c.type} bagi</p>
          <p className="mt-3 text-3xl font-bold text-brand-800">{s.participant_name}</p>
          <p className="mx-auto mt-6 max-w-xl text-stone-600">
            telah dilaksanakan melalui {c.title}, satu bahagian ({s.slot}/{pkg.shares_per_animal}) daripada{" "}
            {animalLabel[pkg.animal_kind].toLowerCase()} <span className="font-mono">{s.animal.code}</span>
            {s.animal.slaughtered_at ? ` pada ${dateMY(s.animal.slaughtered_at)}` : ""}{c.location ? ` di ${c.location}` : ""}.
          </p>
          <p className="mt-8 text-sm italic text-stone-500">Semoga Allah menerima ibadah ini.</p>
        </section>
      ))}
    </div>
  );
}
