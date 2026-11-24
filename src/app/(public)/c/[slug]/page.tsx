import { notFound } from "next/navigation";
import { getPublicCampaign } from "@/lib/data";
import { dateMY } from "@/lib/format";
import { availableMethods } from "@/lib/payments";
import { BookingForm } from "./BookingForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const found = await getPublicCampaign((await params).slug);
  return { title: found?.campaign.title ?? "Kempen" };
}

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await getPublicCampaign(slug);
  if (!found) notFound();
  const { campaign: c, packages } = found;
  const methods = availableMethods(!!(c.bank_name && c.bank_account_no));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <span className="badge bg-brand-50 uppercase text-brand-700">{c.type}</span>
      <h1 className="mt-2 text-3xl font-extrabold text-brand-900">{c.title}</h1>
      <p className="mt-1 text-stone-600">{c.location ?? "Lokasi akan dimaklumkan"}{c.event_date ? ` · ${dateMY(c.event_date)}` : ""}</p>
      {c.description && <p className="mt-4 whitespace-pre-line text-stone-700">{c.description}</p>}
      <div className="mt-8">
        {c.status === "open" ? (
          <BookingForm slug={c.slug} packages={packages} methods={methods} />
        ) : (
          <p className="card text-stone-600">Tempahan untuk kempen ini telah ditutup.</p>
        )}
      </div>
    </div>
  );
}
