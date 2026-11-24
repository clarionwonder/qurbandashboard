import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/env";
import { getGateway } from "@/lib/payments";
import { createServiceClient } from "@/lib/supabase/admin";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Starts (or restarts) the gateway payment for an order and sends the browser there. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServiceClient();
  const { data } = await db.from("orders").select("*, campaigns(title)").eq("id", id).maybeSingle();
  const order = data as (Order & { campaigns: { title: string } }) | null;
  if (!order) return NextResponse.redirect(`${siteUrl}/`);
  if (order.status !== "pending") return NextResponse.redirect(`${siteUrl}/order/${id}`);

  const gw = getGateway(order.payment_method);
  if (!gw || !gw.enabled()) return NextResponse.redirect(`${siteUrl}/order/${id}?err=gateway`);

  try {
    const res = await gw.start(order, `Qurban ${order.ref} ${order.campaigns.title}`);
    if (res.billId) await db.from("orders").update({ gateway_bill_id: res.billId }).eq("id", id);
    if (res.kind === "redirect") return NextResponse.redirect(res.url);
    const inputs = Object.entries(res.fields)
      .map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`)
      .join("");
    return new NextResponse(
      `<!doctype html><meta charset="utf-8"><title>Ke halaman bayaran…</title>
<body style="font-family:sans-serif;text-align:center;padding:4rem">
<p>Membawa anda ke halaman bayaran…</p>
<form id="f" method="post" action="${esc(res.action)}">${inputs}<button>Teruskan</button></form>
<script>document.getElementById('f').submit()</script></body>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  } catch (e) {
    console.error("payment start failed", e);
    return NextResponse.redirect(`${siteUrl}/order/${id}?err=gateway`);
  }
}
