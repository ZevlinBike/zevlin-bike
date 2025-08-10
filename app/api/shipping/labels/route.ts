import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { purchaseLabel, type Address, type Parcel } from "@/lib/shippo";

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

    const customer = order.customers as
      | { first_name?: string; last_name?: string; email?: string; phone?: string }
      | null;
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
    const label = await purchaseLabel({ rateId: body.rateObjectId });

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
      .insert(insertPayload)
      .select("*")
      .single();
    if (insertErr) {
      return NextResponse.json({ error: "Failed to persist shipment" }, { status: 500 });
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

    return NextResponse.json({
      labelUrl: label.labelUrl,
      trackingNumber: label.trackingNumber,
      trackingUrl: label.trackingUrl,
      carrier: label.carrier,
      service: label.service,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to purchase label";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
