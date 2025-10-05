import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import Stripe from "stripe";
import { archiveCartForOrder } from "@/app/checkout/actions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  // Require webhook secret to be configured
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook secret not configured" }, { status: 501 });
  }

  const supabase = await createClient();
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    if (!sig) throw new Error("Missing signature");
    event = stripe.webhooks.constructEvent(raw, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 });
  }

  // Dedupe by event id
  const eid = event.id;
  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("external_event_id", eid)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  await supabase.from("webhook_events").insert({
    source: "stripe",
    external_event_id: eid,
    raw: event as unknown as Record<string, unknown>,
  });

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = pi.id;
        // Update matching order to paid + pending_fulfillment and decrement stock if not already
        const { data: order } = await supabase
          .from("orders")
          .select("id, payment_status, order_status")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .maybeSingle();
        if (order?.id) {
          if (order.payment_status !== "paid" || order.order_status === "pending_payment") {
            await supabase
              .from("orders")
              .update({ payment_status: "paid", status: "paid", order_status: "pending_fulfillment" })
              .eq("id", order.id);
            // Best-effort stock decrement (if it didn't occur yet)
            await supabase.rpc("decrement_stock", { order_id_param: order.id });
          }
          // Archive customer's cart once order is successful
          try { await archiveCartForOrder(order.id); } catch {}
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = pi.id;
        const { data: order } = await supabase
          .from("orders")
          .select("id, order_status")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .maybeSingle();
        if (order?.id) {
          // Mark order as cancelled if it was still pending payment
          if (order.order_status === "pending_payment") {
            await supabase
              .from("orders")
              .update({ order_status: "cancelled" })
              .eq("id", order.id);
          }
        }
        break;
      }
      default:
        // Ignore other events; data is stored for audit
        break;
    }
  } catch {
    // Swallow processing errors to avoid retry loops; we persisted the event.
  }

  return NextResponse.json({ ok: true });
}
