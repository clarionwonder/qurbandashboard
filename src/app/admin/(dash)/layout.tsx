import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo, Prefs } from "@/components/Brand";
import { requireAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  const A = (await getI18n()).t.admin;
  const nav = [
    ["/admin", A.nav.overview],
    ["/admin/campaigns", A.nav.campaigns],
    ["/admin/orders", A.nav.orders],
    ["/admin/reports", A.nav.reports],
  ];
  return (
    <div className="min-h-screen">
      <header className="no-print border-b border-brand-800 bg-brand-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3">
          <Logo href="/admin" light />
          <nav className="order-last flex w-full flex-wrap gap-1 text-sm sm:order-none sm:w-auto sm:flex-1">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className="rounded-lg px-3 py-1.5 font-medium text-white/75 hover:bg-white/10 hover:text-white">{label}</Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm text-white/75">
            <Prefs onDark />
            <span className="hidden lg:inline">{user.email}</span>
            <form action={signOut}><button className="whitespace-nowrap rounded-lg px-2 py-1 hover:bg-white/10">{A.signOut}</button></form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
