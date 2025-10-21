import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { createLabel as ssCreateLabel } from "@/lib/shipstation";
import type { Address } from "@/lib/shippo"; // reuse Address type shape

const Body = z.object({
  orderId: z.string().uuid(),
  packageName: z.string().optional(),
  carrierCode: z.string().optional(),
  serviceCode: z.string().optional(),
  packageCode: z.string().optional(),
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
  const { data: roles } = await supabase.rpc("get_user_roles", { user_id: customer.id });
  return { ok: !!(roles && roles.includes("admin")), supabase };
}

export async function POST(req: NextRequest) {
  const { ok, supabase } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!env.SHIPSTATION_API_KEY || !env.SHIPSTATION_API_SECRET) {
    return NextResponse.json({ error: "ShipStation is not configured" }, { status: 501 });
  }

  let body: z.infer<typeof Body>;
  try { body = Body.parse(await req.json()); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  try {
    // Guard: prevent double-purchase for single-package flow
    const { data: existing } = await supabase
      .from("shipments")
      .select("id")
      .eq("order_id", body.orderId)
      .eq("status", "purchased")
      .limit(1)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "A label has already been purchased for this order." }, { status: 409 });
    }

    // Fetch origin address from settings
    const { data: settings } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (!settings) return NextResponse.json({ error: "Store settings not configured" }, { status: 500 });

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

    // Load order + dest + items
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select(`
        *,
        customers(first_name, last_name, email, phone),
        line_items(quantity, products(weight_g), product_variants(weight_g))
      `)
      .eq("id", body.orderId)
      .single();
    if (orderErr || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

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
          name: (sd.name as string | null) || [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || undefined,
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
          name: (order.billing_name as string | null) || [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || undefined,
          email: (customer?.email as string | undefined) || undefined,
          phone: (customer?.phone as string | undefined) || undefined,
          address1: (order.billing_address_line1 as string) || "",
          address2: (order.billing_address_line2 as string | null) || undefined,
          city: (order.billing_city as string) || "",
          state: (order.billing_state as string) || "",
          postal_code: (order.billing_postal_code as string) || "",
          country: (order.billing_country as string) || "US",
        };

    // package selection
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
    if (!pkg) return NextResponse.json({ error: "No shipping package configured" }, { status: 400 });

    // Compute weight
    type LI = { quantity: number; products?: { weight_g?: number | null } | null; product_variants?: { weight_g?: number | null } | null };
    const items = (order.line_items as unknown as LI[]) || [];
    const assumedItemWeightG = 200;
    const itemsWeight = items.reduce((sum, li) => {
      const w = li.product_variants?.weight_g ?? li.products?.weight_g ?? 0;
      const each = w && w > 0 ? w : assumedItemWeightG;
      return sum + each * (li.quantity || 0);
    }, 0);
    const totalWeightG = Math.max(1, (pkg.weight_g || 0) + itemsWeight);
    const parcel = {
      length_cm: Number(pkg.length_cm) || 10,
      width_cm: Number(pkg.width_cm) || 10,
      height_cm: Number(pkg.height_cm) || 5,
      weight_g: totalWeightG,
    };

    // Create label via ShipStation
    const label = await ssCreateLabel({
      to,
      from: ORIGIN,
      parcel,
      carrierCode: body.carrierCode,
      serviceCode: body.serviceCode,
      packageCode: body.packageCode,
    });

    if (!label.labelUrl) {
      return NextResponse.json({ error: "ShipStation did not return a label URL" }, { status: 502 });
    }

    // Persist shipment
    const insertPayload = {
      order_id: body.orderId,
      status: "purchased" as const,
      carrier: label.carrierCode,
      service: label.serviceCode,
      tracking_number: label.trackingNumber,
      tracking_url: null as string | null,
      label_url: label.labelUrl,
      rate_object_id: null as string | null,
      label_object_id: null as string | null,
      price_amount_cents: null as number | null,
      price_currency: "USD",
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
    if (insertErr) return NextResponse.json({ error: "Failed to persist shipment" }, { status: 500 });

    await supabase
      .from("orders")
      .update({ order_status: "fulfilled", shipping_status: "shipped" })
      .eq("id", body.orderId);

    return NextResponse.json({
      shipmentId: shipment.id,
      labelUrl: shipment.label_url,
      trackingNumber: shipment.tracking_number,
      carrier: shipment.carrier,
      service: shipment.service,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create ShipStation label";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
