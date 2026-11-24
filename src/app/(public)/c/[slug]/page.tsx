import { notFound } from "next/navigation";
import { getPublicCampaign } from "@/lib/data";
import { getI18n } from "@/lib/i18n/server";
import { availableMethods } from "@/lib/payments";
import { BookingForm } from "./BookingForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const found = await getPublicCampaign((await params).slug);
  return { title: found?.campaign.title ?? "GERMY Qurban" };
}

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t, lang, date } = await getI18n();
  const found = await getPublicCampaign(slug);
  if (!found) notFound();
  const { campaign: c, packages } = found;
  const methods = availableMethods(!!(c.bank_name && c.bank_account_no));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <span className="badge bg-brand-50 uppercase text-accent">{c.type}</span>
      <h1 className="mt-2 text-3xl font-extrabold text-ink">{c.title}</h1>
      <p className="mt-1 text-stone-600">{c.location ?? t.home.tba}{c.event_date ? ` · ${date(c.event_date)}` : ""}</p>
      {c.description && <p className="mt-4 whitespace-pre-line text-stone-700">{c.description}</p>}
      <div className="mt-8">
        {c.status === "open" ? (
          <BookingForm slug={c.slug} packages={packages} methods={methods} lang={lang} />
        ) : (
          <p className="card text-stone-600">{t.book.closed}</p>
        )}
      </div>
    </div>
  );
}
