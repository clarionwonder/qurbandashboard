"use client";

import { useActionState, useMemo, useState } from "react";
import type { PackageWithStock } from "@/lib/data";
import { animalLabel, methodLabel, rm } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";
import { createOrder, type BookingState } from "./actions";

export function BookingForm({ slug, packages, methods }: { slug: string; packages: PackageWithStock[]; methods: PaymentMethod[] }) {
  const firstAvailable = packages.find((p) => p.shares_remaining === null || p.shares_remaining > 0);
  const [pkgId, setPkgId] = useState(firstAvailable?.id ?? "");
  const [qty, setQty] = useState(1);
  const [state, action, pending] = useActionState<BookingState, FormData>(createOrder, {});
  const pkg = useMemo(() => packages.find((p) => p.id === pkgId), [packages, pkgId]);
  const maxQty = Math.min(50, pkg?.shares_remaining ?? 50);

  if (packages.length === 0) return <p className="card text-stone-600">Pakej belum disediakan untuk kempen ini.</p>;

  return (
    <form action={action} className="grid gap-6">
      <input type="hidden" name="slug" value={slug} />

      <fieldset className="card">
        <legend className="px-1 text-base font-bold text-brand-900">1. Pilih pakej</legend>
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
                    <p className="font-semibold text-brand-900">{p.name}</p>
                    <p className="text-xs text-stone-500">
                      {animalLabel[p.animal_kind]} · {p.shares_per_animal > 1 ? `${p.shares_per_animal} bahagian seekor` : "seekor penuh"}
                    </p>
                  </div>
                  <p className="text-right font-bold text-brand-700">{rm(p.price_per_share)}<span className="block text-xs font-normal text-stone-500">/ bahagian</span></p>
                </div>
                {p.description && <p className="mt-2 text-sm text-stone-600">{p.description}</p>}
                <p className="mt-2 text-xs font-medium text-stone-500">
                  {soldOut ? "Penuh" : p.shares_remaining !== null ? `${p.shares_remaining} bahagian lagi` : "Bahagian tersedia"}
                </p>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="card">
        <legend className="px-1 text-base font-bold text-brand-900">2. Bilangan bahagian dan nama peserta</legend>
        <div className="mt-3 flex items-center gap-3">
          <button type="button" className="btn-ghost h-10 w-10 p-0" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Kurang">−</button>
          <input name="quantity" type="number" min={1} max={maxQty} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))} className="input w-20 text-center" />
          <button type="button" className="btn-ghost h-10 w-10 p-0" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} aria-label="Tambah">+</button>
          {pkg && pkg.shares_per_animal > 1 && (
            <button type="button" className="text-sm font-semibold text-brand-700 underline" onClick={() => setQty(Math.min(maxQty, pkg.shares_per_animal))}>
              Tempah seekor penuh ({pkg.shares_per_animal})
            </button>
          )}
        </div>
        <p className="mt-4 text-sm text-stone-600">Nama peserta (niat) untuk setiap bahagian. Biarkan kosong untuk guna nama anda.</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {Array.from({ length: qty }, (_, i) => (
            <input key={i} name="participants" className="input" placeholder={`Bahagian ${i + 1}: cth. Ahmad bin Ali`} />
          ))}
        </div>
      </fieldset>

      <fieldset className="card grid gap-3 sm:grid-cols-2">
        <legend className="px-1 text-base font-bold text-brand-900">3. Maklumat penempah</legend>
        <div className="sm:col-span-2"><label className="label">Nama penuh</label><input name="buyer_name" required className="input" /></div>
        <div><label className="label">No. telefon</label><input name="buyer_phone" required inputMode="tel" placeholder="0123456789" className="input" /></div>
        <div><label className="label">E-mel</label><input name="buyer_email" type="email" required className="input" /></div>
        <div className="sm:col-span-2"><label className="label">Alamat (pilihan)</label><textarea name="buyer_address" rows={2} className="input" /></div>
      </fieldset>

      <fieldset className="card">
        <legend className="px-1 text-base font-bold text-brand-900">4. Kaedah bayaran</legend>
        {methods.length === 0 ? (
          <p className="mt-2 text-sm text-rose-700">Tiada kaedah bayaran disediakan lagi. Sila hubungi penganjur.</p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {methods.map((m, i) => (
              <label key={m} className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-3 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input type="radio" name="payment_method" value={m} defaultChecked={i === 0} className="accent-brand-700" />
                <span className="text-sm font-medium">{methodLabel[m]}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="card sticky bottom-3 border-brand-200 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-stone-500 sm:text-sm">Jumlah</p>
            <p className="text-xl font-extrabold text-brand-900 sm:text-2xl">{rm((pkg?.price_per_share ?? 0) * qty)}</p>
          </div>
          <button className="btn-primary px-4 sm:px-6" disabled={pending || !pkg || methods.length === 0}>
            {pending ? "Memproses…" : "Teruskan ke bayaran"}
          </button>
        </div>
        {state.error && <p className="mt-2 text-sm font-medium text-rose-700">{state.error}</p>}
      </div>
    </form>
  );
}
