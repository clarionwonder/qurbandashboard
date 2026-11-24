import type { AnimalKind, AnimalStatus, OrderStatus, PaymentMethod } from "./types";

export const rm = (n: number | string) =>
  "RM " + Number(n).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const dateMY = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kuala_Lumpur" }) : "-";

export const dateTimeMY = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kuala_Lumpur" }) : "-";

export const animalLabel: Record<AnimalKind, string> = {
  cow: "Lembu", buffalo: "Kerbau", camel: "Unta", goat: "Kambing", sheep: "Biri-biri",
};

export const animalStatusLabel: Record<AnimalStatus, string> = {
  filling: "Filling", full: "Full", slaughtered: "Slaughtered", distributed: "Distributed",
};

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending: "Pending payment", awaiting_verification: "Awaiting verification", paid: "Paid", failed: "Failed", cancelled: "Cancelled",
};

export const orderStatusMs: Record<OrderStatus, string> = {
  pending: "Menunggu bayaran", awaiting_verification: "Menunggu pengesahan", paid: "Telah dibayar", failed: "Gagal", cancelled: "Dibatalkan",
};

export const methodLabel: Record<PaymentMethod, string> = {
  billplz: "Billplz (FPX)", toyyibpay: "ToyyibPay (FPX / Kad)", bayarcash: "Bayarcash (FPX)", senangpay: "SenangPay (FPX / Kad)",
  manual: "Pindahan bank manual", demo: "Bayaran demo (ujian)",
};

export const statusTone: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  awaiting_verification: "bg-sky-100 text-sky-800",
  paid: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-800",
  cancelled: "bg-stone-200 text-stone-700",
  filling: "bg-amber-100 text-amber-800",
  full: "bg-sky-100 text-sky-800",
  slaughtered: "bg-emerald-100 text-emerald-800",
  distributed: "bg-violet-100 text-violet-800",
  open: "bg-emerald-100 text-emerald-800",
  draft: "bg-stone-200 text-stone-700",
  closed: "bg-rose-100 text-rose-800",
};
