import { redirect } from "next/navigation";
import { Logo, Prefs } from "@/components/Brand";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata() {
  return { title: (await getI18n()).t.admin.signInTitle };
}

async function signIn(form: FormData) {
  "use server";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  });
  redirect(error ? "/admin/login?err=invalid" : "/admin");
}

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  const A = (await getI18n()).t.admin;
  return (
    <div className="grid min-h-screen place-items-center bg-brand-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between"><Logo light /><Prefs onDark /></div>
        <form action={signIn} className="card grid gap-3">
          <h1 className="text-lg font-bold text-ink">{A.signInTitle}</h1>
          <div><label className="label">{A.email}</label><input name="email" type="email" required className="input" /></div>
          <div><label className="label">{A.password}</label><input name="password" type="password" required className="input" /></div>
          {err === "invalid" && <p className="text-sm text-rose-700">{A.invalid}</p>}
          {err === "notadmin" && <p className="text-sm text-rose-700">{A.notAdmin}</p>}
          <button className="btn-primary">{A.signIn}</button>
        </form>
        {err === "notadmin" && (
          <form action={signOut} className="mt-3 text-center"><button className="text-sm text-white/75 underline">{A.signOut}</button></form>
        )}
      </div>
    </div>
  );
}
