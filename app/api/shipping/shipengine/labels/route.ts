import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { purchaseLabelByRate } from "@/lib/shipengine";
import { env } from "@/lib/env";

const Body = z.object({ orderId: z.string().uuid(), rateId: z.string().min(1) });

async function requireAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false as const, supabase };
  const { data: customer } = await supabase.from("customers").select("id").eq("auth_user_id", auth.user.id).single();
  if (!customer) return { ok: false as const, supabase };
  const { data: roles } = await supabase.rpc("get_user_roles", { user_id: customer.id });
  return { ok: !!(roles && roles.includes("admin")), supabase };
}

export async function POST(req: NextRequest) {
  if (env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'ShipEngine is disabled in this environment' }, { status: 501 });
  }
  const { ok, supabase } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: z.infer<typeof Body>;
  try { body = Body.parse(await req.json()); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }

  try {
    // Guard: prevent duplicate purchased labels per order (single-package)
    const { data: existing } = await supabase
      .from('shipments')
      .select('id')
      .eq('order_id', body.orderId)
      .eq('status', 'purchased')
      .limit(1)
      .maybeSingle();
    if (existing) return NextResponse.json({ error: 'A label has already been purchased for this order.' }, { status: 409 });

    const { data: settings } = await supabase.from('store_settings').select('*').eq('id', 1).single();
    if (!settings) return NextResponse.json({ error: 'Store settings not configured' }, { status: 500 });

    // Purchase label with ShipEngine by rate id
    const label = await purchaseLabelByRate(body.rateId);
    if (!label.labelUrl) return NextResponse.json({ error: 'ShipEngine did not return a label URL' }, { status: 502 });

    // Destination + order for persistence
    const { data: sd } = await supabase.from('shipping_details').select('*').eq('order_id', body.orderId).maybeSingle();
    const { data: order } = await supabase
      .from('orders')
      .select('*, customers(first_name,last_name,email,phone), line_items(quantity, products(weight_g), product_variants(weight_g))')
      .eq('id', body.orderId)
      .single();
    const rawCustomers = order?.customers as
      | { first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null }
      | { first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null }[]
      | null;
    const customer = Array.isArray(rawCustomers) ? rawCustomers[0] : rawCustomers;
    const to = sd
      ? {
          name: (sd.name as string | null) || [customer?.first_name, customer?.last_name].filter(Boolean).join(' ') || null,
          email: (customer?.email as string | null) || null,
          phone: (customer?.phone as string | null) || null,
          address1: (sd.address_line1 as string) || '',
          address2: (sd.address_line2 as string | null) || null,
          city: (sd.city as string) || '',
          state: (sd.state as string) || '',
          postal_code: (sd.postal_code as string) || '',
          country: (sd.country as string) || 'US',
        }
      : {
          name: (order?.billing_name as string | null) || [customer?.first_name, customer?.last_name].filter(Boolean).join(' ') || null,
          email: (customer?.email as string | null) || null,
          phone: (customer?.phone as string | null) || null,
          address1: (order?.billing_address_line1 as string) || '',
          address2: (order?.billing_address_line2 as string | null) || null,
          city: (order?.billing_city as string) || '',
          state: (order?.billing_state as string) || '',
          postal_code: (order?.billing_postal_code as string) || '',
          country: (order?.billing_country as string) || 'US',
        };

    // Package selection for persistence (defaults)
    let pkg: { name: string; length_cm: number; width_cm: number; height_cm: number; weight_g: number } | null = null;
    const { data: defaultPkg } = await supabase
      .from('shipping_packages')
      .select('name,length_cm,width_cm,height_cm,weight_g')
      .eq('is_default', true)
      .maybeSingle();
    pkg = defaultPkg || { name: 'Default', length_cm: 10, width_cm: 10, height_cm: 5, weight_g: 0 };

    // Compute shipment weight
    type LI = { quantity: number; products?: { weight_g?: number | null } | null; product_variants?: { weight_g?: number | null } | null };
    const items = (order?.line_items as unknown as LI[]) || [];
    const assumedItemWeightG = 200;
    const itemsWeight = items.reduce((sum, li) => {
      const w = li.product_variants?.weight_g ?? li.products?.weight_g ?? 0;
      const each = w && w > 0 ? w : assumedItemWeightG;
      return sum + each * (li.quantity || 0);
    }, 0);
    const totalWeightG = Math.max(1, (pkg.weight_g || 0) + itemsWeight);

    const insertPayload = {
      order_id: body.orderId,
      status: 'purchased' as const,
      carrier: label.carrier || null,
      service: label.service || null,
      tracking_number: label.trackingNumber,
      tracking_url: null as string | null,
      label_url: label.labelUrl,
      rate_object_id: body.rateId,
      label_object_id: null as string | null,
      price_amount_cents: null as number | null,
      price_currency: 'USD',
      to_name: to.name,
      to_phone: to.phone,
      to_email: to.email,
      to_address1: to.address1,
      to_address2: to.address2,
      to_city: to.city,
      to_state: to.state,
      to_postal_code: to.postal_code,
      to_country: to.country,
      from_name: settings.shipping_origin_name,
      from_phone: settings.shipping_origin_phone,
      from_email: settings.shipping_origin_email,
      from_address1: settings.shipping_origin_address1,
      from_address2: settings.shipping_origin_address2,
      from_city: settings.shipping_origin_city,
      from_state: settings.shipping_origin_state,
      from_postal_code: settings.shipping_origin_postal_code,
      from_country: settings.shipping_origin_country,
      package_name: pkg?.name || 'ShipEngine',
      weight_g: totalWeightG,
      length_cm: Number(pkg?.length_cm) || 10,
      width_cm: Number(pkg?.width_cm) || 10,
      height_cm: Number(pkg?.height_cm) || 5,
    };

    const { data: shipment, error: insErr } = await supabase
      .from('shipments')
      .insert(insertPayload)
      .select('*')
      .single();
    if (insErr) return NextResponse.json({ error: 'Failed to persist shipment' }, { status: 500 });

    await supabase.from('orders').update({ order_status: 'fulfilled', shipping_status: 'shipped' }).eq('id', body.orderId);

    return NextResponse.json({
      shipmentId: shipment.id,
      labelUrl: shipment.label_url,
      trackingNumber: shipment.tracking_number,
      carrier: shipment.carrier,
      service: shipment.service,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create ShipEngine label';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
