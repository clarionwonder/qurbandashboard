"use client";

import { useActionState } from "react";
import { uploadProof } from "./actions";

export function ProofForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(uploadProof.bind(null, orderId), {} as { error?: string; ok?: boolean });
  return (
    <form action={action} className="mt-4 grid gap-2">
      <label className="label">Muat naik resit pindahan (JPG, PNG atau PDF, maks. 5MB)</label>
      <input name="proof" type="file" accept="image/*,application/pdf" required className="input file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-brand-700" />
      {state.error && <p className="text-sm text-rose-700">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-700">Resit diterima. Kami akan sahkan dalam masa terdekat.</p>}
      <button className="btn-primary w-fit" disabled={pending}>{pending ? "Memuat naik…" : "Hantar resit"}</button>
    </form>
  );
}
