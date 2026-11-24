import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Brand";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

const nav = [
  ["/admin", "Overview"],
  ["/admin/campaigns", "Campaigns"],
  ["/admin/orders", "Orders"],
  ["/admin/reports", "Reports"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="border-b border-brand-800 bg-brand-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3">
          <Logo href="/admin" light />
          <nav className="flex flex-1 flex-wrap gap-1 text-sm">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className="rounded-lg px-3 py-1.5 font-medium text-brand-100 hover:bg-white/10 hover:text-white">{label}</Link>
            ))}
          </nav>
          <form action={signOut} className="flex items-center gap-3 text-sm text-brand-100">
            <span className="hidden sm:inline">{user.email}</span>
            <button className="rounded-lg px-2 py-1 hover:bg-white/10">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
