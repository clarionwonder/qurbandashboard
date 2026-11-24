import { isSandbox } from "../env";
import type { Gateway } from "./types";
import { callbackUrl, cents, clean, formPost, returnUrl } from "./util";

const base = () => (isSandbox ? "https://www.billplz-sandbox.com/api/v3" : "https://www.billplz.com/api/v3");
const auth = () => ({ Authorization: "Basic " + Buffer.from(`${process.env.BILLPLZ_API_KEY}:`).toString("base64") });

/** Look the bill up with Billplz instead of trusting the request. */
async function lookup(billId: string) {
  const res = await fetch(`${base()}/bills/${encodeURIComponent(billId)}`, { headers: auth(), cache: "no-store" });
  if (!res.ok) throw new Error(`Billplz bill lookup failed: ${res.status}`);
  const bill = (await res.json()) as { id: string; paid: boolean; paid_amount: number; reference_1?: string };
  return {
    billId: bill.id,
    ref: bill.reference_1,
    paid: bill.paid === true,
    verified: true,
    amount: bill.paid_amount / 100,
    txnId: bill.id,
    raw: bill as unknown as Record<string, unknown>,
  };
}

export const billplz: Gateway = {
  id: "billplz",
  label: "Billplz",
  enabled: () => !!(process.env.BILLPLZ_API_KEY && process.env.BILLPLZ_COLLECTION_ID),
  async start(order, description) {
    const text = await formPost(
      `${base()}/bills`,
      {
        collection_id: process.env.BILLPLZ_COLLECTION_ID!,
        email: order.buyer_email,
        mobile: order.buyer_phone,
        name: clean(order.buyer_name, 255),
        amount: String(cents(order.amount)),
        description: clean(description, 200),
        callback_url: callbackUrl("billplz"),
        redirect_url: returnUrl("billplz"),
        reference_1_label: "Order",
        reference_1: order.ref,
      },
      auth(),
    );
    const bill = JSON.parse(text) as { id: string; url: string };
    return { kind: "redirect", url: bill.url, billId: bill.id };
  },
  callback: (p) => lookup(p.id),
  returned: (p) => lookup(p["billplz[id]"]),
};
