import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="text-5xl font-extrabold text-accent">404</p>
        <p className="mt-2 text-stone-600">{t.notFound.text}</p>
        <Link href="/" className="btn-primary mt-6">{t.notFound.back}</Link>
      </div>
    </div>
  );
}
