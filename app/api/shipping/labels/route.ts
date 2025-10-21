import { sendTransactionalEmail } from "@/lib/brevo";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { purchaseLabel, type Address, type Parcel } from "@/lib/shippo";
import { env } from "@/lib/env";

const BodySchema = z.object({
  orderId: z.string().uuid(),
  rateObjectId: z.string().min(1),
  packageName: z.string().optional(),
});

async function requireAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false as const, supabase };

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", auth.user.id)
    .single();
  if (!customer) return { ok: false as const, supabase };

  const { data: roles } = await supabase.rpc("get_user_roles", {
    user_id: customer.id,
  });
  return { ok: !!(roles && roles.includes("admin")), supabase };
}

export async function POST(req: NextRequest) {
  const { ok, supabase } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
    console.log(`[labels] START purchase for order`, body?.orderId, `rate`, body?.rateObjectId);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const idempotencyKey =
    req.headers.get("idempotency-key") || req.headers.get("x-idempotency-key") || undefined;

  try {
    // Fetch origin address from settings
    const { data: settings } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (!settings) {
      return NextResponse.json({ error: "Store settings not configured" }, { status: 500 });
    }

    const ORIGIN: Address = {
      name: settings.shipping_origin_name,
      email: settings.shipping_origin_email,
      phone: settings.shipping_origin_phone,
      address1: settings.shipping_origin_address1,
      address2: settings.shipping_origin_address2,
      city: settings.shipping_origin_city,
      state: settings.shipping_origin_state,
      postal_code: settings.shipping_origin_postal_code,
      country: settings.shipping_origin_country,
    };

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        customers(first_name, last_name, email, phone),
        line_items(
          id,
          quantity,
          unit_price_cents,
          products(weight_g),
          product_variants(weight_g)
        )
      `
      )
      .eq("id", body.orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // guard: ensure no existing purchased label (single-package flow)
    const { data: existing } = await supabase
      .from("shipments")
      .select("id")
      .eq("order_id", body.orderId)
      .eq("status", "purchased")
      .limit(1)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: "A label has already been purchased for this order." },
        { status: 409 }
      );
    }

    // Destination: prefer shipping_details row; fallback to order billing_*
    const { data: sd } = await supabase
      .from("shipping_details")
      .select("*")
      .eq("order_id", body.orderId)
      .maybeSingle();

    const rawCustomers = order.customers as
      | { first_name?: string; last_name?: string; email?: string; phone?: string }
      | { first_name?: string; last_name?: string; email?: string; phone?: string }[]
      | null;
    const customer = Array.isArray(rawCustomers) ? rawCustomers[0] : rawCustomers;
    const to: Address = sd
      ? {
          name:
            (sd.name as string | null) ||
            [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
            undefined,
          email: (customer?.email as string | undefined) || undefined,
          phone: (customer?.phone as string | undefined) || undefined,
          address1: (sd.address_line1 as string) || "",
          address2: (sd.address_line2 as string | null) || undefined,
          city: (sd.city as string) || "",
          state: (sd.state as string) || "",
          postal_code: (sd.postal_code as string) || "",
          country: (sd.country as string) || "US",
        }
      : {
          name:
            (order.billing_name as string | null) ||
            [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
            undefined,
          email: (customer?.email as string | undefined) || undefined,
          phone: (customer?.phone as string | undefined) || undefined,
          address1: (order.billing_address_line1 as string) || "",
          address2: (order.billing_address_line2 as string | null) || undefined,
          city: (order.billing_city as string) || "",
          state: (order.billing_state as string) || "",
          postal_code: (order.billing_postal_code as string) || "",
          country: (order.billing_country as string) || "US",
        };

    // package selection: provided by name or default
    let pkg: { name: string; length_cm: number; width_cm: number; height_cm: number; weight_g: number } | null = null;
    if (body.packageName) {
      const { data } = await supabase
        .from("shipping_packages")
        .select("name,length_cm,width_cm,height_cm,weight_g")
        .eq("name", body.packageName)
        .maybeSingle();
      pkg = data;
    }
    if (!pkg) {
      const { data } = await supabase
        .from("shipping_packages")
        .select("name,length_cm,width_cm,height_cm,weight_g")
        .eq("is_default", true)
        .maybeSingle();
      pkg = data;
    }

    if (!pkg) {
      return NextResponse.json(
        { error: "No shipping package configured. Create one in admin settings." },
        { status: 400 }
      );
    }

    // Compute shipment weight from items
    type LI = {
      quantity: number;
      products?: { weight_g?: number | null } | null;
      product_variants?: { weight_g?: number | null } | null;
    };
    const items = (order.line_items as unknown as LI[]) || [];
    const assumedItemWeightG = 200;
    const itemsWeight = items.reduce((sum, li) => {
      const w = li.product_variants?.weight_g ?? li.products?.weight_g ?? 0;
      const each = w && w > 0 ? w : assumedItemWeightG;
      return sum + each * (li.quantity || 0);
    }, 0);
    const totalWeightG = Math.max(1, (pkg.weight_g || 0) + itemsWeight);
    const parcel: Parcel = {
      length_cm: Number(pkg.length_cm) || 10,
      width_cm: Number(pkg.width_cm) || 10,
      height_cm: Number(pkg.height_cm) || 5,
      weight_g: totalWeightG,
    };

    // Create label via Shippo
    const ref = req.headers.get('referer') || '';
    const isTesting = ref.includes('/admin/testing');
    const token = (
      isTesting
        ? (process.env.SHIPPO_TEST_API_TOKEN || env.SHIPPO_TEST_API_TOKEN)
        : (process.env.SHIPPO_API_TOKEN || env.SHIPPO_API_TOKEN)
    ) || process.env.SHIPPO_API_TOKEN || env.SHIPPO_API_TOKEN || process.env.SHIPPO_TEST_API_TOKEN || env.SHIPPO_TEST_API_TOKEN;
    const tokenType = (token === (process.env.SHIPPO_TEST_API_TOKEN || env.SHIPPO_TEST_API_TOKEN)) ? 'test' : 'prod';
    console.log(`[labels] Using Shippo token type=${tokenType}`);
    const label = await purchaseLabel({ rateId: body.rateObjectId }, { token });
    console.log(`[labels] purchase result tx=${label.transactionId} status=${label.status} label?=${!!label.labelUrl} track=${label.trackingNumber || ''} messages=${(label.messages || []).join(' | ')}`);

    // Harden: if Shippo hasn't populated label_url yet, poll the transaction for longer
    let finalLabelUrl = label.labelUrl;
    let finalTrackingNumber = label.trackingNumber;
    let finalTrackingUrl = label.trackingUrl;
    // First, try a direct transaction fetch using library helper which can retry across tokens
    if (!finalLabelUrl && label.transactionId) {
      try {
        console.log(`[labels] resolving label_url via getLabelUrl(tx=${label.transactionId})`);
        const { getLabelUrl } = await import("@/lib/shippo");
        const url = await getLabelUrl(label.transactionId).catch(() => null);
        console.log(`[labels] getLabelUrl returned?`, !!url);
        if (url) finalLabelUrl = url;
      } catch {}
    }
    if (!finalLabelUrl && label.transactionId) {
      try {
        const maxAttempts = 10; // shorten total wait (~5s)
        for (let i = 0; i < maxAttempts; i++) {
          await new Promise((r) => setTimeout(r, 500));
          const txRes = await fetch(`https://api.goshippo.com/transactions/${label.transactionId}/`, {
            headers: { Accept: "application/json", Authorization: `ShippoToken ${token}` },
            cache: "no-store",
          });
          const tx = await txRes.json();
          try { console.log(`[labels] poll tx keys:`, Object.keys(tx || {})); } catch {}
          if (txRes.ok) {
            const maybeUrl = (tx?.label_url as string | undefined) || (tx?.label_download?.href as string | undefined) || null;
            finalLabelUrl = maybeUrl || finalLabelUrl;
            finalTrackingNumber = (tx?.tracking_number as string | undefined) || finalTrackingNumber;
            finalTrackingUrl = (tx?.tracking_url_provider as string | undefined) || finalTrackingUrl;
            console.log(`[labels] poll ${i+1}/${maxAttempts} status=${txRes.status} label?=${!!finalLabelUrl}`);
            if (finalLabelUrl) break;
          } else if (txRes.status === 401 || txRes.status === 403 || txRes.status === 404) {
            // Try alternate token once if available (prod/test mismatch)
            const alt = (token === (process.env.SHIPPO_API_TOKEN || env.SHIPPO_API_TOKEN))
              ? (process.env.SHIPPO_TEST_API_TOKEN || env.SHIPPO_TEST_API_TOKEN)
              : (process.env.SHIPPO_API_TOKEN || env.SHIPPO_API_TOKEN);
            if (alt) {
              const altRes = await fetch(`https://api.goshippo.com/transactions/${label.transactionId}/`, {
                headers: { Accept: "application/json", Authorization: `ShippoToken ${alt}` },
                cache: "no-store",
              });
              const altTx = await altRes.json().catch(() => ({} as unknown as Record<string, unknown>));
              try { console.log(`[labels] poll alt tx keys:`, Object.keys(altTx || {})); } catch {}
              if (altRes.ok) {
                const maybeUrl = (altTx?.label_url as string | undefined) || (altTx?.label_download?.href as string | undefined) || null;
                finalLabelUrl = maybeUrl || finalLabelUrl;
                finalTrackingNumber = (altTx?.tracking_number as string | undefined) || finalTrackingNumber;
                finalTrackingUrl = (altTx?.tracking_url_provider as string | undefined) || finalTrackingUrl;
                console.log(`[labels] poll alt ${i+1}/${maxAttempts} status=${altRes.status} label?=${!!finalLabelUrl}`);
                if (finalLabelUrl) break;
              }
            }
          }
        }
      } catch {}
    }

    // If still no URL, and Shippo returned blocking messages, surface a clear error and do not insert a shipment
    if (!finalLabelUrl && (label.messages?.length || 0) > 0) {
      const msg = label.messages!.join(' | ');
      console.warn(`[labels] blocking messages from Shippo, aborting insert: ${msg}`);
      return NextResponse.json({ error: msg, shippoMessages: label.messages, transactionId: label.transactionId }, { status: 402 });
    }

    // Persist shipment
    const insertPayload = {
      order_id: body.orderId,
      status: "purchased",
      carrier: label.carrier,
      service: label.service,
      tracking_number: label.trackingNumber,
      tracking_url: label.trackingUrl,
      label_url: label.labelUrl,
      rate_object_id: label.rateObjectId || body.rateObjectId,
      label_object_id: label.transactionId,
      price_amount_cents: label.amountCents ?? null,
      price_currency: label.currency ?? "USD",
      to_name: to.name ?? null,
      to_phone: to.phone ?? null,
      to_email: to.email ?? null,
      to_address1: to.address1,
      to_address2: to.address2 ?? null,
      to_city: to.city,
      to_state: to.state,
      to_postal_code: to.postal_code,
      to_country: to.country,
      from_name: ORIGIN.name ?? null,
      from_phone: ORIGIN.phone ?? null,
      from_email: ORIGIN.email ?? null,
      from_address1: ORIGIN.address1,
      from_address2: ORIGIN.address2 ?? null,
      from_city: ORIGIN.city,
      from_state: ORIGIN.state,
      from_postal_code: ORIGIN.postal_code,
      from_country: ORIGIN.country,
      package_name: pkg.name,
      weight_g: parcel.weight_g,
      length_cm: parcel.length_cm,
      width_cm: parcel.width_cm,
      height_cm: parcel.height_cm,
    };

    const { data: shipment, error: insertErr } = await supabase
      .from("shipments")
      .insert({
        ...insertPayload,
        label_url: finalLabelUrl ?? insertPayload.label_url,
        tracking_number: finalTrackingNumber ?? insertPayload.tracking_number,
        tracking_url: finalTrackingUrl ?? insertPayload.tracking_url,
      })
      .select("*")
      .single();
    console.log(`[labels] insert shipment label?=${!!finalLabelUrl} txId=${label.transactionId} rowId=${shipment?.id || 'unknown'} insertErr?=${!!insertErr}`);
    if (insertErr) {
      return NextResponse.json({ error: "Failed to persist shipment" }, { status: 500 });
    }

    // Final server-side safety: if label_url still missing but Shippo has a transaction id, try one more fetch and persist.
    if (!shipment.label_url && shipment.label_object_id) {
      try {
        const txRes = await fetch(`https://api.goshippo.com/transactions/${shipment.label_object_id}/`, {
          headers: { Accept: "application/json", Authorization: `ShippoToken ${token}` },
          cache: "no-store",
        });
        const tx = await txRes.json();
        if (txRes.ok) {
          const url = (tx?.label_url as string | undefined) || (tx?.label_download?.href as string | undefined) || null;
          const tn = (tx?.tracking_number as string | undefined) || null;
          const tu = (tx?.tracking_url_provider as string | undefined) || null;
          if (url || tn || tu) {
            const { error: upErr } = await supabase
              .from("shipments")
              .update({
                label_url: url ?? shipment.label_url,
                tracking_number: tn ?? shipment.tracking_number,
                tracking_url: tu ?? shipment.tracking_url,
              })
              .eq("id", shipment.id);
            if (upErr) console.error(`[labels] post-insert refresh update failed:`, upErr);
            console.log(`[labels] post-insert refresh status=${txRes.status} url?=${!!url}`);
            if (url) finalLabelUrl = url;
            if (tn) finalTrackingNumber = tn;
            if (tu) finalTrackingUrl = tu;
          }
        } else if (txRes.status === 401 || txRes.status === 403 || txRes.status === 404) {
          const alt = (token === (process.env.SHIPPO_API_TOKEN || env.SHIPPO_API_TOKEN))
            ? (process.env.SHIPPO_TEST_API_TOKEN || env.SHIPPO_TEST_API_TOKEN)
            : (process.env.SHIPPO_API_TOKEN || env.SHIPPO_API_TOKEN);
          if (alt) {
            const altRes = await fetch(`https://api.goshippo.com/transactions/${shipment.label_object_id}/`, {
              headers: { Accept: "application/json", Authorization: `ShippoToken ${alt}` },
              cache: "no-store",
            });
            const altTx = await altRes.json().catch(() => ({} as unknown as Record<string, unknown>));
            if (altRes.ok) {
              const url = (altTx?.label_url as string | undefined) || (altTx?.label_download?.href as string | undefined) || null;
              const tn = (altTx?.tracking_number as string | undefined) || null;
              const tu = (altTx?.tracking_url_provider as string | undefined) || null;
              if (url || tn || tu) {
                const { error: upAltErr } = await supabase
                  .from("shipments")
                  .update({
                    label_url: url ?? shipment.label_url,
                    tracking_number: tn ?? shipment.tracking_number,
                    tracking_url: tu ?? shipment.tracking_url,
                  })
                  .eq("id", shipment.id);
                if (upAltErr) console.error(`[labels] post-insert alt refresh update failed:`, upAltErr);
                console.log(`[labels] post-insert alt refresh status=${altRes.status} url?=${!!url}`);
                if (url) finalLabelUrl = url;
                if (tn) finalTrackingNumber = tn;
                if (tu) finalTrackingUrl = tu;
              }
            }
          }
        }
      } catch {}
    }

    // Update order statuses
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        order_status: "fulfilled",
        shipping_status: "shipped",
      })
      .eq("id", body.orderId);

    if (updateError) {
      // Log this error but don't fail the request, as the label was already purchased
      console.error(`Failed to update order ${body.orderId} status after label purchase:`, updateError);
    }

    // Send shipping confirmation email
    if (to.email) {
      try {
    const emailHtml = `
          <h1>Your Order has Shipped!</h1>
          <p>Your order #${body.orderId} is on its way.</p>
          ${finalTrackingUrl || label.trackingUrl ? `<p>You can track your shipment here: <a href="${finalTrackingUrl || label.trackingUrl}">${finalTrackingUrl || label.trackingUrl}</a></p>` : ''}
          ${finalTrackingNumber || label.trackingNumber ? `<p>Tracking Number: ${finalTrackingNumber || label.trackingNumber}</p>` : ''}
        `;
        await sendTransactionalEmail(
          { email: to.email, name: to.name || '' },
          `Your Zevlin Bike Order #${body.orderId} has shipped`,
          emailHtml
        );
      } catch (emailError) {
        console.error(`Failed to send shipping email for order ${body.orderId}:`, emailError);
      }
    }

    // Log event (also stores idempotency key if provided)
    await supabase.from("shipment_events").insert({
      shipment_id: shipment.id,
      event_code: "LABEL_PURCHASED",
      description: "Label purchased via admin UI",
      raw: {
        idempotency_key: idempotencyKey || null,
        rate_object_id: body.rateObjectId,
      },
    });

    console.log(`[labels] DONE order=${body.orderId} tx=${label.transactionId} label?=${!!finalLabelUrl}`);
    return NextResponse.json({
      shipmentId: shipment.id,
      labelUrl: finalLabelUrl ?? label.labelUrl ?? null,
      trackingNumber: finalTrackingNumber ?? label.trackingNumber ?? null,
      trackingUrl: finalTrackingUrl ?? label.trackingUrl ?? null,
      carrier: label.carrier,
      service: label.service,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to purchase label";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
