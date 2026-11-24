import { isSandbox } from "../env";
import type { Gateway } from "./types";
import { callbackUrl, cents, clean, formPost, returnUrl } from "./util";

const base = () => (isSandbox ? "https://dev.toyyibpay.com" : "https://toyyibpay.com");

async function lookup(billCode: string, ref?: string) {
  const text = await formPost(`${base()}/index.php/api/getBillTransactions`, { billCode });
  let rows: Array<Record<string, string>> = [];
  try { rows = JSON.parse(text); } catch { rows = []; }
  const paidRow = Array.isArray(rows) ? rows.find((r) => String(r.billpaymentStatus) === "1") : undefined;
  return {
    billId: billCode,
    ref,
    paid: !!paidRow,
    verified: true,
    amount: paidRow ? Number(paidRow.billpaymentAmount) : undefined,
    txnId: paidRow?.billpaymentInvoiceNo,
    raw: { rows } as Record<string, unknown>,
  };
}

export const toyyibpay: Gateway = {
  id: "toyyibpay",
  label: "ToyyibPay",
  enabled: () => !!(process.env.TOYYIBPAY_SECRET_KEY && process.env.TOYYIBPAY_CATEGORY_CODE),
  async start(order, description) {
    const text = await formPost(`${base()}/index.php/api/createBill`, {
      userSecretKey: process.env.TOYYIBPAY_SECRET_KEY!,
      categoryCode: process.env.TOYYIBPAY_CATEGORY_CODE!,
      billName: clean(`GERMY ${order.ref}`, 30),
      billDescription: clean(description, 100),
      billPriceSetting: "1",
      billPayorInfo: "1",
      billAmount: String(cents(order.amount)),
      billReturnUrl: returnUrl("toyyibpay"),
      billCallbackUrl: callbackUrl("toyyibpay"),
      billExternalReferenceNo: order.ref,
      billTo: clean(order.buyer_name, 100),
      billEmail: order.buyer_email,
      billPhone: order.buyer_phone,
      billPaymentChannel: "2",
      billChargeToCustomer: "",
    });
    const data = JSON.parse(text) as Array<{ BillCode: string }>;
    const code = data?.[0]?.BillCode;
    if (!code) throw new Error(`ToyyibPay createBill failed: ${text.slice(0, 200)}`);
    return { kind: "redirect", url: `${base()}/${code}`, billId: code };
  },
  callback: (p) => lookup(p.billcode, p.order_id),
  returned: (p) => lookup(p.billcode, p.order_id),
};
