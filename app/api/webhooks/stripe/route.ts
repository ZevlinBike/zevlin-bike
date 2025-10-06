import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { env } from "@/lib/env";
import Stripe from "stripe";
import { archiveCartForOrder } from "@/app/checkout/actions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  // Require webhook secret to be configured
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook secret not configured" }, { status: 501 });
  }

  // Use service-role client so RLS can remain strict on webhook tables
  const supabase = createServiceClient();
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
        // First, try to find an existing order by PI
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
        } else if (pi.metadata && typeof pi.metadata['invoice_id'] === 'string') {
          // Handle invoice-based payment by creating an order now
          const invoiceId = pi.metadata['invoice_id'] as string;
          const { data: invoice } = await supabase
            .from('invoices')
            .select('id, customer_id, final_total_cents')
            .eq('id', invoiceId)
            .maybeSingle();
          if (invoice?.id) {
            // Create order shell
            const { data: created } = await supabase
              .from('orders')
              .insert({
                customer_id: invoice.customer_id || null,
                status: 'paid',
                payment_status: 'paid',
                order_status: 'pending_fulfillment',
                shipping_status: 'not_shipped',
                subtotal_cents: invoice.final_total_cents,
                shipping_cost_cents: 0,
                tax_cents: 0,
                discount_cents: 0,
                total_cents: invoice.final_total_cents,
                stripe_payment_intent_id: paymentIntentId,
              })
              .select('id')
              .single();
            if (created?.id) {
              // Copy invoice items into order line_items (best-effort)
              const { data: invItems } = await supabase
                .from('invoice_items')
                .select('product_id, quantity, unit_price_cents')
                .eq('invoice_id', invoiceId);
              if (invItems && invItems.length) {
                await supabase.from('line_items').insert(invItems.map(ii => ({
                  order_id: created.id,
                  product_id: ii.product_id,
                  quantity: ii.quantity,
                  unit_price_cents: ii.unit_price_cents,
                })));
              }
              await supabase.from('invoices').update({ status: 'paid', order_id: created.id }).eq('id', invoiceId);
              try { await archiveCartForOrder(created.id); } catch {}
            }
          }
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
