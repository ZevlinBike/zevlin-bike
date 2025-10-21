// app/api/admin/orders/[orderId]/shipments/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Address } from "@/lib/shippo";
import { getLabelUrl } from "@/lib/shippo";
import { sendTransactionalEmail } from "@/lib/brevo";

// NB: createClient() is async in your setup, so we use Awaited<ReturnType<...>>
type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

async function requireAdmin(supabase: ServerSupabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  if (!customer) return false;

  const { data: roles } = await supabase.rpc("get_user_roles", {
    user_id: customer.id,
  });

  return !!(roles && Array.isArray(roles) && roles.includes("admin"));
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ orderId: string }> }
) {
  const supabase = await createClient();

  const isAdmin = await requireAdmin(supabase);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await ctx.params;
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    const { data: shipments, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // For shipments with a label_object_id, fetch the latest URL, as it expires.
    const refreshedShipments = await Promise.all(
      shipments.map(async (shipment) => {
        if (shipment.label_object_id) {
          try {
            console.log(`[admin.shipments] refreshing label for shipment=${shipment.id} tx=${shipment.label_object_id}`);
            const latestLabelUrl = await getLabelUrl(shipment.label_object_id);
            // If DB label_url is missing but Shippo has one, persist it for reliability
            if (latestLabelUrl && !shipment.label_url) {
              try {
                await supabase
                  .from("shipments")
                  .update({ label_url: latestLabelUrl })
                  .eq("id", shipment.id);
                console.log(`[admin.shipments] persisted missing label_url for shipment=${shipment.id}`);
              } catch (persistErr) {
                console.warn(`Failed to persist refreshed label URL for shipment ${shipment.id}:`, persistErr);
              }
            }
            return { ...shipment, label_url: latestLabelUrl || shipment.label_url };
          } catch (e) {
            console.error(`Failed to refresh label URL for shipment ${shipment.id}:`, e);
            // Return original shipment data on error
            return shipment;
          }
        }
        return shipment;
      })
    );

    return NextResponse.json({ shipments: refreshedShipments });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch shipments";
    console.error(`Failed to fetch shipments for order ${orderId}:`, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

const ManualShipmentSchema = z.object({
  carrier: z.string().min(1),
  service: z.string().optional().nullable(),
  tracking_number: z.string().min(1),
  tracking_url: z.string().url().optional().nullable(),
  status: z.string().optional().default('shipped'),
  email: z.boolean().optional().default(true),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ orderId: string }> }
) {
  const supabase = await createClient();
  const isAdmin = await requireAdmin(supabase);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId } = await ctx.params;
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

  let body: z.infer<typeof ManualShipmentSchema>;
  try {
    body = ManualShipmentSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    // Load order + destination info
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select(`
        id, customer_id, order_status, shipping_status,
        customers(email, first_name, last_name, phone),
        shipping_details(name, address_line1, address_line2, city, state, postal_code, country),
        line_items(quantity, products(weight_g), product_variants(weight_g))
      `)
      .eq('id', orderId)
      .single();
    if (orderErr || !order) throw new Error('Order not found');

    // Fetch origin address from settings to satisfy non-null columns
    const { data: settings } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    const ORIGIN: Address | null = settings
      ? {
          name: settings.shipping_origin_name,
          email: settings.shipping_origin_email,
          phone: settings.shipping_origin_phone,
          address1: settings.shipping_origin_address1,
          address2: settings.shipping_origin_address2,
          city: settings.shipping_origin_city,
          state: settings.shipping_origin_state,
          postal_code: settings.shipping_origin_postal_code,
          country: settings.shipping_origin_country,
        }
      : null;

    const rawCustomers = order.customers as
      | { first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null }
      | { first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null }[]
      | null;
    const customer = Array.isArray(rawCustomers) ? rawCustomers[0] : rawCustomers;
    const sd = Array.isArray(order.shipping_details) ? order.shipping_details[0] : order.shipping_details;

    const to = sd
      ? {
          name: (sd as { name?: string | null }).name ?? undefined,
          email: (customer?.email as string | undefined) || undefined,
          phone: (customer?.phone as string | undefined) || undefined,
          address1: (sd as { address_line1?: string | null }).address_line1 || '',
          address2: (sd as { address_line2?: string | null }).address_line2 || undefined,
          city: (sd as { city?: string | null }).city || '',
          state: (sd as { state?: string | null }).state || '',
          postal_code: (sd as { postal_code?: string | null }).postal_code || '',
          country: (sd as { country?: string | null }).country || 'US',
        }
      : null;

    // Package selection (default), and compute weight
    let pkg: { name?: string | null; length_cm?: number | null; width_cm?: number | null; height_cm?: number | null; weight_g?: number | null } | null = null;
    const { data: defaultPkg } = await supabase
      .from('shipping_packages')
      .select('name,length_cm,width_cm,height_cm,weight_g')
      .eq('is_default', true)
      .maybeSingle();
    pkg = defaultPkg ?? null;

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
    const totalWeightG = Math.max(1, ((pkg?.weight_g ?? 0) || 0) + itemsWeight);
    const length_cm = Number(pkg?.length_cm) || 10;
    const width_cm = Number(pkg?.width_cm) || 10;
    const height_cm = Number(pkg?.height_cm) || 5;

    const insertPayload: Record<string, unknown> = {
      order_id: orderId,
      status: body.status || 'shipped',
      carrier: body.carrier,
      service: body.service || null,
      tracking_number: body.tracking_number,
      tracking_url: body.tracking_url || null,
      label_url: null,
      rate_object_id: null,
      label_object_id: null,
      package_name: (pkg?.name as string | null) ?? 'Manual',
      weight_g: totalWeightG,
      length_cm,
      width_cm,
      height_cm,
      // Destination fields (if table has NOT NULL constraints)
      to_name: to?.name ?? null,
      to_email: to?.email ?? null,
      to_phone: to?.phone ?? null,
      to_address1: to?.address1 ?? null,
      to_address2: to?.address2 ?? null,
      to_city: to?.city ?? null,
      to_state: to?.state ?? null,
      to_postal_code: to?.postal_code ?? null,
      to_country: to?.country ?? null,
      // Origin fields (best-effort)
      from_name: ORIGIN?.name ?? null,
      from_phone: ORIGIN?.phone ?? null,
      from_email: ORIGIN?.email ?? null,
      from_address1: ORIGIN?.address1 ?? null,
      from_address2: ORIGIN?.address2 ?? null,
      from_city: ORIGIN?.city ?? null,
      from_state: ORIGIN?.state ?? null,
      from_postal_code: ORIGIN?.postal_code ?? null,
      from_country: ORIGIN?.country ?? null,
    };

    const { data: inserted, error: insErr } = await supabase
      .from('shipments')
      .insert(insertPayload)
      .select('id')
      .single();
    if (insErr) throw insErr;

    // Update order statuses
    await supabase
      .from('orders')
      .update({ order_status: 'fulfilled', shipping_status: 'shipped' })
      .eq('id', orderId);

    // Log event
    await supabase.from('shipment_events').insert({
      shipment_id: inserted.id,
      event_code: 'MANUAL_SHIPMENT_CREATED',
      description: 'Manual shipment recorded via admin UI',
      raw: { carrier: body.carrier, service: body.service || null, tracking_number: body.tracking_number, tracking_url: body.tracking_url || null },
    });

    // Send email notification
    if (body.email) {
      const rawCustomer = Array.isArray(order.customers) ? order.customers?.[0] : order.customers;
      const customer: { email?: string | null; first_name?: string | null; last_name?: string | null } | null | undefined =
        (rawCustomer && typeof rawCustomer === 'object') ? (rawCustomer as { email?: string | null; first_name?: string | null; last_name?: string | null }) : null;
      const emailTo = customer?.email ?? undefined;
      if (emailTo) {
        const shipName = Array.isArray(order.shipping_details) ? order.shipping_details[0]?.name : undefined;
        const toName = (customer?.first_name && customer?.last_name)
          ? `${customer.first_name} ${customer.last_name}`
          : (shipName || '');
        const html = `
          <h1>Your Order Has Shipped</h1>
          <p>Your order #${orderId} is on the way.</p>
          <p>Carrier: <strong>${body.carrier.toUpperCase()}</strong>${body.service ? ` • ${body.service}` : ''}</p>
          <p>Tracking Number: <strong>${body.tracking_number}</strong></p>
          ${body.tracking_url ? `<p>Track your package: <a href="${body.tracking_url}">${body.tracking_url}</a></p>` : ''}
        `;
        try {
          await sendTransactionalEmail(
            { email: emailTo, name: toName },
            `Your Zevlin Bike Order #${orderId} has shipped`,
            html
          );
        } catch (e) {
          console.error('Failed to send shipment email:', e);
          // non-fatal
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string')
        ? String((err as { message?: unknown }).message)
        : 'Failed to create manual shipment';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
