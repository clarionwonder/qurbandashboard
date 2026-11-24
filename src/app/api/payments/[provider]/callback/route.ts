import { NextResponse } from "next/server";
import { applyVerification } from "@/lib/orders";
import { getGateway } from "@/lib/payments";

export const dynamic = "force-dynamic";

/** Server-to-server payment notification from a gateway. */
export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const gw = getGateway(provider);
  if (!gw) return new NextResponse("unknown provider", { status: 404 });

  const type = req.headers.get("content-type") ?? "";
  let body: Record<string, string> = {};
  if (type.includes("application/json")) {
    body = Object.fromEntries(Object.entries(await req.json()).map(([k, v]) => [k, String(v ?? "")]));
  } else {
    body = Object.fromEntries([...(await req.formData()).entries()].map(([k, v]) => [k, String(v)]));
  }

  try {
    const v = await gw.callback(body);
    await applyVerification(gw.id, "callback", v);
  } catch (e) {
    console.error(`${provider} callback error`, e);
    return new NextResponse("error", { status: 500 });
  }
  return new NextResponse(gw.callbackAck ?? "OK");
}
