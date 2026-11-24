import { redirect } from "next/navigation";
import { Logo } from "@/components/Brand";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Log masuk penganjur" };

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
  return (
    <div className="grid min-h-screen place-items-center bg-brand-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center"><Logo light /></div>
        <form action={signIn} className="card grid gap-3">
          <h1 className="text-lg font-bold text-brand-900">Organiser sign in</h1>
          <div><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
          <div><label className="label">Password</label><input name="password" type="password" required className="input" /></div>
          {err === "invalid" && <p className="text-sm text-rose-700">Wrong email or password.</p>}
          {err === "notadmin" && <p className="text-sm text-rose-700">This account is not an organiser. Ask an existing admin to add you.</p>}
          <button className="btn-primary">Sign in</button>
        </form>
        {err === "notadmin" && (
          <form action={signOut} className="mt-3 text-center"><button className="text-sm text-brand-100 underline">Sign out</button></form>
        )}
      </div>
    </div>
  );
}
