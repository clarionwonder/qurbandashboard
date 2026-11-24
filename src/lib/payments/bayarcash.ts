import { isSandbox } from "../env";
import type { Gateway, Verification } from "./types";
import { callbackUrl, hmac256, returnUrl, safeEqual } from "./util";

const base = () => (isSandbox ? "https://api.console.bayarcash-sandbox.com/v3" : "https://api.console.bayar.cash/v3");
const SUCCESS = "3";

/** Bayarcash checksum: values sorted by key, joined with "|", HMAC-SHA256 with the API secret key. */
function checksum(fields: Record<string, string>) {
  const keys = Object.keys(fields).sort();
  return hmac256(process.env.BAYARCASH_SECRET_KEY!, keys.map((k) => fields[k]).join("|"));
}

async function lookupTxn(id: string): Promise<Verification> {
  const res = await fetch(`${base()}/transactions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${process.env.BAYARCASH_PAT}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Bayarcash transaction lookup failed: ${res.status}`);
  const t = (await res.json()) as Record<string, unknown>;
  return {
    ref: String(t.order_number ?? ""),
    paid: String(t.status) === SUCCESS,
    verified: true,
    amount: Number(t.amount),
    txnId: id,
    raw: t,
  };
}

async function verify(p: Record<string, string>): Promise<Verification> {
  const { checksum: given, ...rest } = p;
  if (given && safeEqual(checksum(rest), given)) {
    return { ref: p.order_number, paid: p.status === SUCCESS, verified: true, amount: Number(p.amount), txnId: p.transaction_id, raw: p };
  }
  if (p.transaction_id) return lookupTxn(p.transaction_id);
  return { ref: p.order_number, paid: false, verified: false, raw: p };
}

export const bayarcash: Gateway = {
  id: "bayarcash",
  label: "Bayarcash",
  enabled: () => !!(process.env.BAYARCASH_PAT && process.env.BAYARCASH_PORTAL_KEY && process.env.BAYARCASH_SECRET_KEY),
  async start(order) {
    const signed = {
      payment_channel: "1",
      order_number: order.ref,
      amount: Number(order.amount).toFixed(2),
      payer_name: order.buyer_name,
      payer_email: order.buyer_email,
    };
    const res = await fetch(`${base()}/payment-intents`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.BAYARCASH_PAT}`, Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        ...signed,
        payment_channel: 1,
        portal_key: process.env.BAYARCASH_PORTAL_KEY,
        payer_telephone_number: order.buyer_phone,
        return_url: returnUrl("bayarcash"),
        callback_url: callbackUrl("bayarcash"),
        checksum: checksum(signed),
      }),
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Bayarcash payment intent failed: ${res.status} ${text.slice(0, 300)}`);
    const data = JSON.parse(text) as { url: string; id?: string };
    return { kind: "redirect", url: data.url, billId: data.id };
  },
  callback: verify,
  returned: verify,
};
