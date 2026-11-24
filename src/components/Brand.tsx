import Link from "next/link";
import { setLang, setTheme } from "@/lib/i18n/actions";
import { getI18n, getTheme } from "@/lib/i18n/server";

export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-700 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3c4 2.5 6 5.5 6 9a6 6 0 0 1-12 0c0-3.5 2-6.5 6-9Z" />
          <path d="M12 9v9" />
        </svg>
      </span>
      <span className={`whitespace-nowrap text-base font-extrabold tracking-tight sm:text-lg ${light ? "text-white" : "text-ink"}`}>
        GERMY <span className="font-semibold text-gold-500">Qurban</span>
      </span>
    </Link>
  );
}

const nextTheme = { system: "dark", dark: "light", light: "system" } as const;

/** Language (BM / EN) and theme (light / dark / device) switches. */
export async function Prefs({ onDark = false }: { onDark?: boolean }) {
  const { lang, t } = await getI18n();
  const theme = await getTheme();
  const base = onDark ? "text-white/70 hover:text-white" : "text-stone-500 hover:text-ink";
  const active = onDark ? "bg-white/15 text-white" : "bg-brand-50 text-accent";
  return (
    <div className="no-print flex items-center gap-1">
      <div className={`flex rounded-lg p-0.5 text-xs font-bold ${onDark ? "bg-white/5" : "bg-stone-100"}`} aria-label={t.lang.switchTo}>
        {(["ms", "en"] as const).map((l) => (
          <form key={l} action={setLang.bind(null, l)}>
            <button className={`rounded-md px-2 py-1 ${lang === l ? active : base}`} aria-pressed={lang === l}>{t.lang[l]}</button>
          </form>
        ))}
      </div>
      <form action={setTheme.bind(null, nextTheme[theme])}>
        <button className={`grid h-8 w-8 place-items-center rounded-lg ${base}`} title={`${t.theme.label}: ${t.theme[theme]}`} aria-label={`${t.theme.label}: ${t.theme[theme]}`}>
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {theme === "light" && (<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>)}
            {theme === "dark" && <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />}
            {theme === "system" && (<><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>)}
          </svg>
        </button>
      </form>
    </div>
  );
}

export async function PublicHeader() {
  const { t } = await getI18n();
  return (
    <header className="no-print border-b border-stone-200 bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Logo />
        <div className="flex items-center gap-3 sm:gap-5">
          <nav className="hidden items-center gap-4 whitespace-nowrap text-sm font-medium text-stone-600 sm:flex">
            <Link href="/#kempen" className="hover:text-accent">{t.nav.campaigns}</Link>
            <Link href="/semak" className="hover:text-accent">{t.nav.lookup}</Link>
          </nav>
          <Prefs />
        </div>
      </div>
      <nav className="flex gap-4 border-t border-stone-100 px-4 py-2 text-xs font-medium text-stone-600 sm:hidden">
        <Link href="/#kempen" className="hover:text-accent">{t.nav.campaigns}</Link>
        <Link href="/semak" className="hover:text-accent">{t.nav.lookup}</Link>
      </nav>
    </header>
  );
}

export async function PublicFooter() {
  const { t } = await getI18n();
  return (
    <footer className="no-print mt-16 border-t border-stone-200 bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-stone-500">
        © {new Date().getFullYear()} GERMY. {t.footer}
      </div>
    </footer>
  );
}

export function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
