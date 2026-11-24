import { redirect } from "next/navigation";
import { getI18n } from "@/lib/i18n/server";
import { createServiceClient } from "@/lib/supabase/admin";

export async function generateMetadata() {
  return { title: (await getI18n()).t.lookup.title };
}

async function lookup(form: FormData) {
  "use server";
  const ref = String(form.get("ref") ?? "").trim().toUpperCase();
  const phone = String(form.get("phone") ?? "").replace(/[\s-]/g, "");
  const db = createServiceClient();
  const { data } = await db.from("orders").select("id").eq("ref", ref).eq("buyer_phone", phone).maybeSingle();
  redirect(data ? `/order/${data.id}` : "/semak?err=notfound");
}

export default async function Semak({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  const L = (await getI18n()).t.lookup;
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-2xl font-extrabold text-ink">{L.title}</h1>
      <p className="mt-1 text-sm text-stone-600">{L.lead}</p>
      <form action={lookup} className="card mt-6 grid gap-3">
        <div><label className="label">{L.ref}</label><input name="ref" required placeholder="GQ2600001" className="input uppercase" /></div>
        <div><label className="label">{L.phone}</label><input name="phone" required inputMode="tel" className="input" /></div>
        {err === "notfound" && <p className="text-sm text-rose-700">{L.notFound}</p>}
        {err === "return" && <p className="text-sm text-rose-700">{L.returnErr}</p>}
        <button className="btn-primary">{L.submit}</button>
      </form>
    </div>
  );
}
