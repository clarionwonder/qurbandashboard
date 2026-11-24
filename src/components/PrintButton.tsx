"use client";

export function PrintButton({ label = "Cetak / Simpan PDF" }: { label?: string }) {
  return <button onClick={() => window.print()} className="btn-primary no-print">{label}</button>;
}
