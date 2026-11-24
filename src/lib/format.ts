export const rm = (n: number | string) =>
  "RM " + Number(n).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
