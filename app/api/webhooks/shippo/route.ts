import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { env } from "@/lib/env";
import crypto from "crypto";

type ShippoEvent = {
  id?: string;
  event?: string;
  type?: string;
  status?: string;
  tracking_status?: string;
  tracking_number?: string;
  transaction?: { object_id?: string };
  data?: {
    id?: string;
    object_id?: string;
    status?: string;
    tracking_status?: string;
    tracking_number?: string;
  };
};

function getHeader(req: NextRequest, name: string) {
  return req.headers.get(name) || req.headers.get(name.toLowerCase()) || null;
}

export async function POST(req: NextRequest) {
  // Use service-role client so RLS can remain strict on webhook tables
  const supabase = createServiceClient();
  const secret = env.SHIPPO_WEBHOOK_SECRET;
  const provided =
    getHeader(req, "x-shippo-secret") || getHeader(req, "shippo-secret") || getHeader(req, "authorization");
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await req.text();
  let event: Record<string, unknown> | null = null;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Idempotency: dedupe by event id if present, else content hash
  const e = (event || {}) as ShippoEvent;
  const externalId: string =
    e.id || e.data?.id || e.data?.object_id ||
    crypto.createHash("sha256").update(raw).digest("hex");

  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("external_event_id", externalId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  await supabase.from("webhook_events").insert({
    source: "shippo",
    external_event_id: externalId,
    raw: event,
  });

  // Determine shipment and status updates
  try {
    const code = String(e.event || e.type || "").toUpperCase();
    let shipmentId: string | null = null;
    let statusUpdate: string | null = null;

    // Try to link shipment by label transaction id first
    const labelObjectId = e.data?.object_id || e.transaction?.object_id || null;
    if (labelObjectId) {
      const { data: s } = await supabase
        .from("shipments")
        .select("id")
        .eq("label_object_id", labelObjectId)
        .maybeSingle();
      shipmentId = s?.id || null;
    }

    // Fallback: link by tracking number
    if (!shipmentId) {
      const trackingNumber = e.data?.tracking_number || e.tracking_number || null;
      if (trackingNumber) {
        const { data: s } = await supabase
          .from("shipments")
          .select("id")
          .eq("tracking_number", trackingNumber)
          .maybeSingle();
        shipmentId = s?.id || null;
      }
    }

    // Interpret states
    const txStatus = (e.data?.status || e.status || "").toString().toUpperCase();
    const trackingStatus = (e.data?.tracking_status || e.tracking_status || "").toString().toUpperCase();

    if (/DELIVERED/.test(trackingStatus)) {
      statusUpdate = "delivered";
    } else if (/SUCCESS/.test(txStatus)) {
      statusUpdate = "purchased";
    } else if (/ERROR|FAIL/.test(txStatus)) {
      statusUpdate = "error";
    }

    if (shipmentId) {
      await supabase.from("shipment_events").insert({
        shipment_id: shipmentId,
        event_code: code || (statusUpdate ? `STATUS_${statusUpdate.toUpperCase()}` : "WEBHOOK"),
        description: `Shippo webhook: ${code || txStatus || trackingStatus}`,
        raw: event,
      });

      if (statusUpdate) {
        await supabase
          .from("shipments")
          .update({ status: statusUpdate })
          .eq("id", shipmentId);

        // For delivered updates, reflect on parent order.shipping_status
        if (statusUpdate === "delivered") {
          const { data: sh } = await supabase
            .from("shipments")
            .select("order_id")
            .eq("id", shipmentId)
            .maybeSingle();
          if (sh?.order_id) {
            await supabase
              .from("orders")
              .update({ shipping_status: "delivered" })
              .eq("id", sh.order_id);
          }
        }
      }
    }
  } catch {
    // Swallow processing errors to avoid retries loops; data is stored in webhook_events
  }

  return NextResponse.json({ ok: true });
}
