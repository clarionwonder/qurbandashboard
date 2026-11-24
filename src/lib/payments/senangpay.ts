import { isSandbox } from "../env";
import type { Gateway, Verification } from "./types";
import { hmac256, safeEqual } from "./util";

const secret = () => process.env.SENANGPAY_SECRET_KEY!;

/** SenangPay hash: HMAC-SHA256(secret, secret + status_id + order_id + transaction_id + msg). */
function verify(p: Record<string, string>): Verification {
  const expected = hmac256(secret(), secret() + (p.status_id ?? "") + (p.order_id ?? "") + (p.transaction_id ?? "") + (p.msg ?? ""));
  const ok = !!p.hash && safeEqual(expected, p.hash);
  return { ref: p.order_id, paid: ok && p.status_id === "1", verified: ok, txnId: p.transaction_id, raw: p };
}

export const senangpay: Gateway = {
  id: "senangpay",
  label: "SenangPay",
  enabled: () => !!(process.env.SENANGPAY_MERCHANT_ID && process.env.SENANGPAY_SECRET_KEY),
  async start(order, description) {
    const detail = description.replace(/[^A-Za-z0-9 _-]/g, "").replace(/\s+/g, "_").slice(0, 100);
    const amount = Number(order.amount).toFixed(2);
    const host = isSandbox ? "https://sandbox.senangpay.my" : "https://app.senangpay.my";
    return {
      kind: "form",
      action: `${host}/payment/${process.env.SENANGPAY_MERCHANT_ID}`,
      fields: {
        detail,
        amount,
        order_id: order.ref,
        name: order.buyer_name,
        email: order.buyer_email,
        phone: order.buyer_phone,
        hash: hmac256(secret(), secret() + detail + amount + order.ref),
      },
    };
  },
  callback: async (p) => verify(p),
  returned: async (p) => verify(p),
  callbackAck: "OK",
};
