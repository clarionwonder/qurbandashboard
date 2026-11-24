import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/admin";

export const metadata = { title: "Semak tempahan" };

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
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-2xl font-extrabold text-brand-900">Semak tempahan</h1>
      <p className="mt-1 text-sm text-stone-600">Masukkan no. tempahan dan no. telefon yang digunakan semasa menempah.</p>
      <form action={lookup} className="card mt-6 grid gap-3">
        <div><label className="label">No. tempahan</label><input name="ref" required placeholder="GQ2600001" className="input uppercase" /></div>
        <div><label className="label">No. telefon</label><input name="phone" required inputMode="tel" className="input" /></div>
        {err === "notfound" && <p className="text-sm text-rose-700">Tempahan tidak dijumpai. Sila semak maklumat anda.</p>}
        {err === "return" && <p className="text-sm text-rose-700">Kami tidak dapat mengesahkan bayaran secara automatik. Sila semak tempahan anda di sini.</p>}
        <button className="btn-primary">Semak</button>
      </form>
    </div>
  );
}
