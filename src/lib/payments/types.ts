import type { Order, PaymentMethod } from "../types";

export type StartResult =
  | { kind: "redirect"; url: string; billId?: string }
  | { kind: "form"; action: string; fields: Record<string, string>; billId?: string };

/** Outcome of a callback or return, already verified with the gateway. */
export interface Verification {
  /** our order ref or the gateway bill id, used to find the order */
  ref?: string;
  billId?: string;
  paid: boolean;
  /** true when the signature or a server-side status lookup confirmed the result */
  verified: boolean;
  /** amount the gateway says was paid, in RM */
  amount?: number;
  txnId?: string;
  raw: Record<string, unknown>;
}

export interface Gateway {
  id: Exclude<PaymentMethod, "manual" | "demo">;
  label: string;
  enabled(): boolean;
  start(order: Order, description: string): Promise<StartResult>;
  /** server-to-server notification */
  callback(params: Record<string, string>): Promise<Verification>;
  /** browser redirect back from the gateway */
  returned(params: Record<string, string>): Promise<Verification>;
  /** text body the gateway expects in reply to a callback */
  callbackAck?: string;
}
