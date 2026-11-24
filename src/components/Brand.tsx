import Link from "next/link";

export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3c4 2.5 6 5.5 6 9a6 6 0 0 1-12 0c0-3.5 2-6.5 6-9Z" />
          <path d="M12 9v9" />
        </svg>
      </span>
      <span className={`text-lg font-extrabold tracking-tight ${light ? "text-white" : "text-brand-900"}`}>
        GERMY <span className="font-semibold text-gold-500">Qurban</span>
      </span>
    </Link>
  );
}

export function PublicHeader() {
  return (
    <header className="no-print border-b border-stone-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Logo />
        <nav className="flex items-center gap-4 text-sm font-medium text-stone-600">
          <Link href="/#kempen" className="hover:text-brand-700">Kempen</Link>
          <Link href="/semak" className="hover:text-brand-700">Semak tempahan</Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="no-print mt-16 border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-stone-500">
        © {new Date().getFullYear()} GERMY. Ibadah qurban dan aqiqah diurus dengan amanah.
      </div>
    </footer>
  );
}

export function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
