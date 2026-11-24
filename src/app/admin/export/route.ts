import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const csvCell = (v: unknown) => {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // guard against spreadsheet formula injection
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows: unknown[][]) => "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return new NextResponse("Forbidden", { status: 403 });

  const url = new URL(req.url);
  const campaign = url.searchParams.get("campaign");
  const type = url.searchParams.get("type") ?? "orders";
  const status = url.searchParams.get("status");
  let rows: unknown[][];

  if (type === "participants") {
    let q = supabase
      .from("shares")
      .select("slot, participant_name, animals!inner(code, status, campaign_id, packages(name)), orders(ref, buyer_name, buyer_phone, buyer_email, paid_at)")
      .order("created_at");
    if (campaign) q = q.eq("animals.campaign_id", campaign);
    const { data } = await q;
    type Row = { slot: number; participant_name: string; animals: { code: string; status: string; packages: { name: string } }; orders: { ref: string; buyer_name: string; buyer_phone: string; buyer_email: string; paid_at: string } };
    rows = [["Animal", "Package", "Share", "Participant", "Animal status", "Order ref", "Buyer", "Phone", "Email", "Paid at"]];
    for (const r of (data ?? []) as unknown as Row[]) {
      rows.push([r.animals.code, r.animals.packages?.name, r.slot, r.participant_name, r.animals.status, r.orders.ref, r.orders.buyer_name, r.orders.buyer_phone, r.orders.buyer_email, r.orders.paid_at]);
    }
    rows.sort((a, b) => String(a[0]).localeCompare(String(b[0])) || Number(a[2]) - Number(b[2]));
  } else {
    let q = supabase.from("orders").select("*, packages(name), campaigns(title)").order("created_at");
    if (campaign) q = q.eq("campaign_id", campaign);
    if (status) q = q.eq("status", status);
    const { data } = await q;
    rows = [["Ref", "Campaign", "Package", "Buyer", "Phone", "Email", "Address", "Shares", "Participants", "Amount (RM)", "Method", "Status", "Gateway ref", "Created", "Paid at"]];
    for (const o of data ?? []) {
      rows.push([o.ref, o.campaigns?.title, o.packages?.name, o.buyer_name, o.buyer_phone, o.buyer_email, o.buyer_address, o.quantity, (o.participants ?? []).join("; "), Number(o.amount).toFixed(2), o.payment_method, o.status, o.gateway_txn_id, o.created_at, o.paid_at]);
    }
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="germy-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
