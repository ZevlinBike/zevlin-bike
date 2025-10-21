import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Address } from "@/lib/shipengine";
import { getRates as seGetRates } from "@/lib/shipengine";
import { env } from "@/lib/env";

const BodySchema = z.object({ orderId: z.string().uuid(), packageId: z.string().uuid().optional() });

export async function POST(req: NextRequest) {
  if (env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'ShipEngine is disabled in this environment' }, { status: 501 });
  }
  const supabase = await createClient();
  let body: z.infer<typeof BodySchema>;
  try { body = BodySchema.parse(await req.json()); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  try {
    const { data: settings } = await supabase.from("store_settings").select("*").eq("id", 1).single();
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

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*, customers(first_name,last_name,email,phone)")
      .eq("id", body.orderId)
      .single();
    if (orderErr || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const { data: sd } = await supabase.from("shipping_details").select("*").eq("order_id", body.orderId).maybeSingle();
    const rawCustomers = order.customers as
      | { first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null }
      | { first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null }[]
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

    let pkg: { name: string; length_cm: number; width_cm: number; height_cm: number; weight_g: number } | null = null;
    if (body.packageId) {
      const { data } = await supabase.from("shipping_packages").select("name,length_cm,width_cm,height_cm,weight_g").eq("id", body.packageId).maybeSingle();
      pkg = data;
    }
    if (!pkg) {
      const { data } = await supabase.from("shipping_packages").select("name,length_cm,width_cm,height_cm,weight_g").eq("is_default", true).maybeSingle();
      pkg = data;
    }
    if (!pkg) return NextResponse.json({ error: "No shipping package configured" }, { status: 400 });

    // Weight calc (same as other routes): 200g per item if unspecified
    const { data: lineItems } = await supabase
      .from("line_items")
      .select("quantity, products(weight, weight_unit)")
      .eq("order_id", body.orderId);
    type LI = { quantity: number; products?: { weight?: number | null; weight_unit?: string | null } | null };
    const items = (lineItems as unknown as LI[]) || [];
    const assumedItemWeightG = 200;
    const itemsWeight = items.reduce((sum, li) => {
      const weight = li.products?.weight;
      const unit = li.products?.weight_unit;
      if (weight && unit) {
        let g = 0;
        switch (unit) { case 'g': g = weight; break; case 'oz': g = weight * 28.3495; break; case 'lb': g = weight * 453.592; break; case 'kg': g = weight * 1000; break; }
        return sum + g * (li.quantity || 0);
      }
      return sum + assumedItemWeightG * (li.quantity || 0);
    }, 0);
    const totalWeightG = Math.max(1, (pkg.weight_g || 0) + itemsWeight);

    const parcel = { length_cm: Number(pkg.length_cm) || 10, width_cm: Number(pkg.width_cm) || 10, height_cm: Number(pkg.height_cm) || 5, weight_g: totalWeightG };
    const rates = await seGetRates({ to, from: ORIGIN, parcel });
    const out = rates.map(r => ({
      rateObjectId: r.rateId,
      carrier: r.carrier,
      service: r.service,
      amountCents: r.amountCents,
      currency: r.currency,
      estimatedDays: r.estimatedDays,
    }));
    return NextResponse.json({ rates: out, totalWeightG });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to get ShipEngine rates';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
