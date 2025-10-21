import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { getLabelUrl } from "@/lib/shippo";

const Body = z.object({ shipmentId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  let body: z.infer<typeof Body>;
  try { body = Body.parse(await req.json()); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  try {
    console.log(`[labels.ensure-url] START shipmentId=${body.shipmentId}`);
    const { data: sh, error } = await supabase
      .from("shipments")
      .select("id, label_url, label_object_id, tracking_number, tracking_url")
      .eq("id", body.shipmentId)
      .single();
    if (error || !sh) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

    if (sh.label_url) {
      console.log(`[labels.ensure-url] already set label_url`);
      return NextResponse.json({ labelUrl: sh.label_url, trackingNumber: sh.tracking_number, trackingUrl: sh.tracking_url });
    }

    if (!sh.label_object_id) {
      return NextResponse.json({ error: "No label_object_id on shipment" }, { status: 400 });
    }

    // Try both Shippo tokens implicitly (prod/test) until one returns a URL
    console.log(`[labels.ensure-url] resolving label via getLabelUrl tx=${sh.label_object_id}`);
    const labelUrl = await getLabelUrl(sh.label_object_id).catch(() => null);
    if (!labelUrl) return NextResponse.json({ error: "Transaction missing label_url" }, { status: 424 });

    // Attempt to refresh tracking data with same token used inside getLabelUrl
    let trackingNumber: string | undefined = sh.tracking_number || undefined;
    let trackingUrl: string | undefined = sh.tracking_url || undefined;
    try {
      // Best-effort: fetch again to enrich tracking fields; ignore failures
      const token = env.SHIPPO_API_TOKEN || process.env.SHIPPO_API_TOKEN || env.SHIPPO_TEST_API_TOKEN || process.env.SHIPPO_TEST_API_TOKEN;
      if (token) {
        const res = await fetch(`https://api.goshippo.com/transactions/${sh.label_object_id}/`, {
          headers: { Accept: "application/json", Authorization: `ShippoToken ${token}` },
          cache: "no-store",
        });
        const tx = await res.json().catch(() => ({} as unknown as Record<string, unknown>));
        if (res.ok) {
          trackingNumber = (tx?.tracking_number as string | undefined) || trackingNumber;
          trackingUrl = (tx?.tracking_url_provider as string | undefined) || trackingUrl;
          try { console.log(`[labels.ensure-url] tx keys:`, Object.keys(tx || {})); } catch {}
        }
      }
    } catch {}

    const { error: upErr } = await supabase
      .from("shipments")
      .update({ label_url: labelUrl, tracking_number: trackingNumber ?? sh.tracking_number, tracking_url: trackingUrl ?? sh.tracking_url })
      .eq("id", body.shipmentId);
    if (upErr) console.error(`[labels.ensure-url] update failed`, upErr);

    console.log(`[labels.ensure-url] persisted label_url ok`);
    return NextResponse.json({ labelUrl, trackingNumber: trackingNumber ?? sh.tracking_number, trackingUrl: trackingUrl ?? sh.tracking_url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to resolve label URL";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
