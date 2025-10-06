"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
function isNextRedirectError(e: unknown): e is { digest: string } {
  if (e && typeof e === 'object' && 'digest' in e) {
    const d = (e as { digest?: unknown }).digest;
    return typeof d === 'string' && d.startsWith('NEXT_REDIRECT;');
  }
  return false;
}
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";

// Create a pending order that will be paid later by the customer.
// Expects minimal inputs: customer email and total amount (USD dollars).
export async function createPendingOrder(formData: FormData) {
  const supabase = await createClient();

  try {
    const email = (formData.get("email") as string | null)?.trim();
    const name = (formData.get("name") as string | null)?.trim() || null;
    const totalStr = (formData.get("total") as string | null)?.trim();

    if (!email || !totalStr) {
      return redirect(`/admin/functions?error=missing_required_fields`);
    }
    const total = Number(totalStr);
    if (!Number.isFinite(total) || total <= 0) {
      return redirect(`/admin/functions?error=invalid_amount`);
    }
    const totalCents = Math.round(total * 100);

    // Find or create customer by email
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    let customerId = existingCustomer?.id as string | undefined;
    if (!customerId) {
      // naive split for name
      const [first_name = "", ...rest] = (name || "").split(" ");
      const last_name = rest.join(" ");
      const { data: newCustomer, error: custErr } = await supabase
        .from("customers")
        .insert({ email, first_name, last_name })
        .select("id")
        .single();
      if (custErr) throw custErr;
      customerId = newCustomer!.id;
    }

    // Create order shell first to get id
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId || null,
        status: "pending",
        payment_status: "pending",
        order_status: "pending_payment",
        shipping_status: "not_shipped",
        subtotal_cents: totalCents,
        shipping_cost_cents: 0,
        tax_cents: 0,
        discount_cents: 0,
        total_cents: totalCents,
        billing_name: name,
      })
      .select("id")
      .single();
    if (orderErr) throw orderErr;

    const orderId = order!.id as string;

    // Create PaymentIntent for the order total
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY not configured");
      return redirect(`/admin/functions?error=stripe_not_configured`);
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const pi = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        source: "admin_functions",
        flow: "pay_existing_order",
        order_id: orderId,
        email,
      },
    });

    // Attach PI id to order
    await supabase
      .from("orders")
      .update({ stripe_payment_intent_id: pi.id })
      .eq("id", orderId);

    // Redirect back with created id and client secret so UI can show share link
    const cs = encodeURIComponent(pi.client_secret || '');
    redirect(`/admin/functions?created=${orderId}&cs=${cs}`);
  } catch (e) {
    // Don't swallow Next's redirect control flow
    if (isNextRedirectError(e)) throw e;
    console.error("Failed to create pending order:", e);
    redirect(`/admin/functions?error=create_pending_order`);
  }
}

// Create an invoice with optional itemization and a PaymentIntent; return share link via redirect.
export async function createInvoice(formData: FormData) {
  const supabase = await createClient();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : null;
  const db = service ?? supabase;

  try {
    const email = (formData.get("email") as string | null)?.trim();
    const name = (formData.get("name") as string | null)?.trim() || null;
    const note = (formData.get("note") as string | null)?.trim() || null;
    const itemsJson = (formData.get("items") as string | null) || "[]";
    const finalTotalCents = Number(formData.get("final_total_cents") || 0);
    const suggestedTotalCents = Number(formData.get("suggested_total_cents") || 0);

    if (!email) {
      return redirect(`/admin/functions?error=missing_required_fields`);
    }
    if (!Number.isFinite(finalTotalCents) || finalTotalCents <= 0) {
      return redirect(`/admin/functions?error=invalid_amount`);
    }

    let parsedItems: { product_id: string; quantity: number }[] = [];
    try { parsedItems = JSON.parse(itemsJson) || []; } catch {}
    // Fetch product prices for items to ensure unit price integrity
    const productIds = parsedItems.map(i => i.product_id);
    const uniqueIds = Array.from(new Set(productIds));
    const priceMap = new Map<string, number>();
    if (uniqueIds.length > 0) {
      const { data: prods } = await db.from('products').select('id, price_cents').in('id', uniqueIds);
      (prods || []).forEach(p => priceMap.set(p.id, p.price_cents));
    }
    const invoiceItems = parsedItems
      .filter(i => i.quantity && i.quantity > 0 && priceMap.has(i.product_id))
      .map(i => ({ product_id: i.product_id, quantity: Math.floor(i.quantity), unit_price_cents: priceMap.get(i.product_id)! }));

    // Find or create customer by email (best-effort)
    const { data: existingCustomer } = await db
      .from("customers")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    let customerId = existingCustomer?.id as string | undefined;
    if (!customerId && (name || email)) {
      const [first_name = "", ...rest] = (name || "").split(" ");
      const last_name = rest.join(" ");
      const { data: newCustomer } = await db
        .from("customers")
        .insert({ email, first_name, last_name })
        .select("id")
        .single();
      customerId = newCustomer?.id;
    }

    // Create invoice
    const { data: invoice, error: invErr } = await db
      .from('invoices')
      .insert({
        customer_id: customerId || null,
        email,
        name,
        note,
        status: 'pending',
        suggested_total_cents: suggestedTotalCents || 0,
        final_total_cents: finalTotalCents,
      })
      .select('id')
      .single();
    if (invErr) throw invErr;

    const invoiceId = invoice!.id as string;

    if (invoiceItems.length > 0) {
      await db.from('invoice_items').insert(invoiceItems.map(it => ({ ...it, invoice_id: invoiceId })));
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Missing STRIPE_SECRET_KEY');
      return redirect(`/admin/functions?error=stripe_not_configured`);
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const pi = await stripe.paymentIntents.create({
      amount: finalTotalCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        source: 'admin_invoice',
        invoice_id: invoiceId,
        email,
      },
    });

    await db.from('invoices').update({ stripe_payment_intent_id: pi.id }).eq('id', invoiceId);

    // Redirect back with invoice id + client secret for share link
    const cs = encodeURIComponent(pi.client_secret || '');
    redirect(`/admin/functions?invoice=${invoiceId}&cs=${cs}`);
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    console.error('Failed to create invoice:', e);
    redirect(`/admin/functions?error=create_invoice_failed`);
  }
}
