// app/api/admin/orders/[orderId]/refund/route.ts
import { sendTransactionalEmail } from "@/lib/brevo";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ orderId: string }> }
) {
  const supabase = await createClient();

  const { orderId } = await ctx.params;

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId (route param)" }, { status: 400 });
  }

  try {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("stripe_payment_intent_id, customers(email, first_name, last_name)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: "No payment intent associated with this order." },
        { status: 400 }
      );
    }

    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
    });

    if (refund.status !== "succeeded") {
      return NextResponse.json(
        { error: `Refund failed: ${refund.status}` },
        { status: 400 }
      );
    }

    // best-effort status update
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "refunded",
        order_status: "cancelled",
      })
      .eq("id", orderId);

    if (updateError) {
      console.error(`Refund OK but failed to update order ${orderId}:`, updateError);
    }

    // Send refund notification email
    if (order.customers && order.customers.length > 0 && order.customers[0].email) {
      try {
        const customer = order.customers[0];
        const emailHtml = `
          <h1>Your Order has been Refunded</h1>
          <p>Your order #${orderId} has been successfully refunded.</p>
          <p>The funds should appear in your account within 5-10 business days.</p>
        `;
        await sendTransactionalEmail(
          { email: customer.email, name: `${customer.first_name} ${customer.last_name}` },
          `Your Zevlin Bike Order #${orderId} has been refunded`,
          emailHtml
        );
      } catch (emailError) {
        console.error(`Failed to send refund email for order ${orderId}:`, emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to process refund";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
