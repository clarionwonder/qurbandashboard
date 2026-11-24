import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/env";
import { applyVerification } from "@/lib/orders";
import { getGateway } from "@/lib/payments";

export const dynamic = "force-dynamic";

async function handle(req: Request, provider: string) {
  const gw = getGateway(provider);
  if (!gw) return NextResponse.redirect(`${siteUrl}/`);
  const url = new URL(req.url);
  const params: Record<string, string> = Object.fromEntries(url.searchParams.entries());
  if (req.method === "POST") {
    for (const [k, v] of (await req.formData()).entries()) params[k] = String(v);
  }
  try {
    const v = await gw.returned(params);
    const order = await applyVerification(gw.id, "return", v);
    if (order) return NextResponse.redirect(`${siteUrl}/order/${order.id}`, 303);
  } catch (e) {
    console.error(`${provider} return error`, e);
  }
  return NextResponse.redirect(`${siteUrl}/semak?err=return`, 303);
}

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  return handle(req, (await params).provider);
}
export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  return handle(req, (await params).provider);
}
