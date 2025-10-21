import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

// Debug endpoint to inspect Shippo transaction payloads for a given transactionId.
// Tries primary token then secondary (prod/test) and returns whichever succeeded
// along with the response keys to help diagnose missing label_url.

async function fetchTx(id: string, token: string, tag: string) {
  const res = await fetch(`https://api.goshippo.com/transactions/${id}/`, {
    headers: { Accept: "application/json", Authorization: `ShippoToken ${token}` },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({} as unknown as Record<string, unknown>));
  return { tag, status: res.status, ok: res.ok, keys: Object.keys(json || {}), tx: json };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ transactionId: string }> }) {
  const { transactionId } = await ctx.params;
  if (!transactionId) return NextResponse.json({ error: "Missing transactionId" }, { status: 400 });

  const primary = env.SHIPPO_API_TOKEN || env.SHIPPO_TEST_API_TOKEN;
  const secondary = (primary && env.SHIPPO_API_TOKEN && env.SHIPPO_TEST_API_TOKEN)
    ? (primary === env.SHIPPO_API_TOKEN ? env.SHIPPO_TEST_API_TOKEN : env.SHIPPO_API_TOKEN)
    : undefined;

  if (!primary) return NextResponse.json({ error: "No Shippo token configured" }, { status: 500 });

  const out: Record<string, unknown> = {};
  try {
    const first = await fetchTx(transactionId, primary, "primary");
    out.primary = first;
    if (first.ok) return NextResponse.json(out);
    if (secondary) {
      const second = await fetchTx(transactionId, secondary, "secondary");
      out.secondary = second;
      return NextResponse.json(out, { status: second.ok ? 200 : 502 });
    }
    return NextResponse.json(out, { status: 502 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
