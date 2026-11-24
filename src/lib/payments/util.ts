import { createHmac, timingSafeEqual } from "node:crypto";
import { siteUrl } from "../env";

export const hmac256 = (key: string, data: string) => createHmac("sha256", key).update(data).digest("hex");

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a.toLowerCase());
  const y = Buffer.from(b.toLowerCase());
  return x.length === y.length && timingSafeEqual(x, y);
}

export const callbackUrl = (id: string) => `${siteUrl}/api/payments/${id}/callback`;
export const returnUrl = (id: string) => `${siteUrl}/api/payments/${id}/return`;

export const cents = (rm: number) => Math.round(Number(rm) * 100);

/** Strip characters some gateways reject in names/descriptions. */
export const clean = (s: string, max: number) => s.replace(/[^\p{L}\p{N} .,_-]/gu, "").slice(0, max).trim();

export async function formPost(url: string, body: Record<string, string>, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers },
    body: new URLSearchParams(body).toString(),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${url} -> ${res.status}: ${text.slice(0, 300)}`);
  return text;
}
