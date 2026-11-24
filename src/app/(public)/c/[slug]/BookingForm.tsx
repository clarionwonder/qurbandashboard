"use client";

import { useActionState, useMemo, useState } from "react";
import type { PackageWithStock } from "@/lib/data";
import { rm } from "@/lib/format";
import { dictionaries, type Lang } from "@/lib/i18n/dict";
import type { PaymentMethod } from "@/lib/types";
import { createOrder, type BookingState } from "./actions";

export function BookingForm({ slug, packages, methods, lang }: { slug: string; packages: PackageWithStock[]; methods: PaymentMethod[]; lang: Lang }) {
  const t = dictionaries[lang];
  const b = t.book;
  const firstAvailable = packages.find((p) => p.shares_remaining === null || p.shares_remaining > 0);
  const [pkgId, setPkgId] = useState(firstAvailable?.id ?? "");
  const [qty, setQty] = useState(1);
  const [state, action, pending] = useActionState<BookingState, FormData>(createOrder, {});
  const pkg = useMemo(() => packages.find((p) => p.id === pkgId), [packages, pkgId]);
  const maxQty = Math.min(50, pkg?.shares_remaining ?? 50);

  if (packages.length === 0) return <p className="card text-stone-600">{b.noPackages}</p>;

  return (
    <form action={action} className="grid gap-6">
      <input type="hidden" name="slug" value={slug} />

      <fieldset className="card">
        <legend className="px-1 text-base font-bold text-ink">{b.step1}</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {packages.map((p) => {
            const soldOut = p.shares_remaining !== null && p.shares_remaining <= 0;
            return (
              <label
                key={p.id}
                className={`cursor-pointer rounded-xl border p-4 transition ${pkgId === p.id ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-stone-200 hover:border-brand-200"} ${soldOut ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <input type="radio" name="package_id" value={p.id} className="sr-only" checked={pkgId === p.id} disabled={soldOut}
                  onChange={() => { setPkgId(p.id); setQty(1); }} />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-stone-500">{t.animal[p.animal_kind]} · {b.sharesEach(p.shares_per_animal)}</p>
                  </div>
                  <p className="text-right font-bold text-accent">{rm(p.price_per_share)}<span className="block text-xs font-normal text-stone-500">{b.perShare}</span></p>
                </div>
                {p.description && <p className="mt-2 text-sm text-stone-600">{p.description}</p>}
                <p className="mt-2 text-xs font-medium text-stone-500">
                  {soldOut ? b.soldOut : p.shares_remaining !== null ? b.left(p.shares_remaining) : b.available}
                </p>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="card">
        <legend className="px-1 text-base font-bold text-ink">{b.step2}</legend>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" className="btn-ghost h-10 w-10 p-0" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={b.less}>−</button>
          <input name="quantity" type="number" min={1} max={maxQty} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))} className="input w-20 text-center" />
          <button type="button" className="btn-ghost h-10 w-10 p-0" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} aria-label={b.more}>+</button>
          {pkg && pkg.shares_per_animal > 1 && (
            <button type="button" className="text-sm font-semibold text-accent underline" onClick={() => setQty(Math.min(maxQty, pkg.shares_per_animal))}>
              {b.whole(pkg.shares_per_animal)}
            </button>
          )}
        </div>
        <p className="mt-4 text-sm text-stone-600">{b.namesHint}</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {Array.from({ length: qty }, (_, i) => (
            <input key={i} name="participants" className="input" placeholder={b.namePh(i + 1)} />
          ))}
        </div>
      </fieldset>

      <fieldset className="card grid gap-3 sm:grid-cols-2">
        <legend className="px-1 text-base font-bold text-ink">{b.step3}</legend>
        <div className="sm:col-span-2"><label className="label">{b.fullName}</label><input name="buyer_name" required className="input" /></div>
        <div><label className="label">{b.phone}</label><input name="buyer_phone" required inputMode="tel" placeholder="0123456789" className="input" /></div>
        <div><label className="label">{b.email}</label><input name="buyer_email" type="email" required className="input" /></div>
        <div className="sm:col-span-2"><label className="label">{b.address}</label><textarea name="buyer_address" rows={2} className="input" /></div>
      </fieldset>

      <fieldset className="card">
        <legend className="px-1 text-base font-bold text-ink">{b.step4}</legend>
        {methods.length === 0 ? (
          <p className="mt-2 text-sm text-rose-700">{b.noMethods}</p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {methods.map((m, i) => (
              <label key={m} className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-3 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input type="radio" name="payment_method" value={m} defaultChecked={i === 0} className="accent-brand-500" />
                <span className="text-sm font-medium">{t.method[m]}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="card sticky bottom-3 border-brand-200 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-stone-500 sm:text-sm">{b.total}</p>
            <p className="text-xl font-extrabold text-ink sm:text-2xl">{rm((pkg?.price_per_share ?? 0) * qty)}</p>
          </div>
          <button className="btn-primary px-4 sm:px-6" disabled={pending || !pkg || methods.length === 0}>
            {pending ? b.processing : b.submit}
          </button>
        </div>
        {state.error && <p className="mt-2 text-sm font-medium text-rose-700">{state.error}</p>}
      </div>
    </form>
  );
}
