import { isDemo } from "../env";
import type { PaymentMethod } from "../types";
import { bayarcash } from "./bayarcash";
import { billplz } from "./billplz";
import { senangpay } from "./senangpay";
import { toyyibpay } from "./toyyibpay";
import type { Gateway } from "./types";

export const gateways: Gateway[] = [billplz, toyyibpay, bayarcash, senangpay];

export const getGateway = (id: string) => gateways.find((g) => g.id === id);

export const demoEnabled = () => isDemo || process.env.ENABLE_DEMO_PAYMENT === "true";

/** Payment methods a participant can choose for a campaign. */
export function availableMethods(hasBankDetails: boolean): PaymentMethod[] {
  const list: PaymentMethod[] = gateways.filter((g) => g.enabled()).map((g) => g.id);
  if (hasBankDetails) list.push("manual");
  if (demoEnabled()) list.push("demo");
  return list;
}
