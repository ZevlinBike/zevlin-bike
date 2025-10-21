import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/brevo";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;
async function requireAdmin(supabase: ServerSupabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  if (!customer) return false;
  const { data: roles } = await supabase.rpc("get_user_roles", { user_id: customer.id });
  return !!(roles && Array.isArray(roles) && roles.includes("admin"));
}

const PatchSchema = z.object({
  status: z.string().optional(),
  tracking_url: z.string().url().optional().nullable(),
  tracking_number: z.string().optional().nullable(),
  carrier: z.string().optional().nullable(),
  service: z.string().optional().nullable(),
  email: z.boolean().optional().default(true),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ shipmentId: string }> }
) {
  const supabase = await createClient();
  const isAdmin = await requireAdmin(supabase);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { shipmentId } = await ctx.params;
  if (!shipmentId) return NextResponse.json({ error: 'Missing shipmentId' }, { status: 400 });

  let body: z.infer<typeof PatchSchema>;
  try { body = PatchSchema.parse(await req.json()); } catch { return NextResponse.json({ error: 'Invalid payload' }, { status: 400 }); }

  try {
    // Fetch shipment + related order
    const { data: shipment, error: shErr } = await supabase
      .from('shipments')
      .select('id, order_id, status, carrier, service, tracking_number, tracking_url')
      .eq('id', shipmentId)
      .single();
    if (shErr || !shipment) throw new Error('Shipment not found');

    // Update shipment
    const updatePayload: Record<string, unknown> = {};
    if (body.status) updatePayload.status = body.status;
    if (body.tracking_url !== undefined) updatePayload.tracking_url = body.tracking_url;
    if (body.tracking_number !== undefined) updatePayload.tracking_number = body.tracking_number;
    if (body.carrier !== undefined) updatePayload.carrier = body.carrier;
    if (body.service !== undefined) updatePayload.service = body.service;
    if (Object.keys(updatePayload).length) {
      await supabase.from('shipments').update(updatePayload).eq('id', shipmentId);
    }

    // Optionally update order status when delivered
    if (body.status === 'delivered') {
      await supabase
        .from('orders')
        .update({ shipping_status: 'delivered', order_status: 'fulfilled' })
        .eq('id', shipment.order_id);
    }

    // Log event
    await supabase.from('shipment_events').insert({
      shipment_id: shipmentId,
      event_code: 'MANUAL_SHIPMENT_UPDATED',
      description: 'Manual shipment updated via admin UI',
      raw: body,
    });

    // Email customer if requested
    if (body.email) {
      const { data: order } = await supabase
        .from('orders')
        .select('id, customers(email, first_name, last_name), shipping_details(name)')
        .eq('id', shipment.order_id)
        .single();
      const rawCustomer = Array.isArray(order?.customers) ? order?.customers?.[0] : order?.customers;
      const customer: { email?: string | null; first_name?: string | null; last_name?: string | null } | null | undefined =
        (rawCustomer && typeof rawCustomer === 'object') ? (rawCustomer as { email?: string | null; first_name?: string | null; last_name?: string | null }) : null;
      const emailTo = customer?.email ?? undefined;
      if (emailTo) {
        const shipName = Array.isArray(order?.shipping_details) ? order?.shipping_details?.[0]?.name : undefined;
        const toName = (customer?.first_name && customer?.last_name)
          ? `${customer.first_name} ${customer.last_name}`
          : (shipName || '');
        const newStatus = body.status || 'updated';
        const html = `
          <h1>Shipment Update</h1>
          <p>Your order #${order?.id} shipment has been <strong>${newStatus}</strong>.</n>
          ${(body.tracking_number || shipment.tracking_number) ? `<p>Tracking Number: <strong>${body.tracking_number || shipment.tracking_number}</strong></p>` : ''}
          ${(body.tracking_url || shipment.tracking_url) ? `<p>Track here: <a href="${body.tracking_url || shipment.tracking_url}">${body.tracking_url || shipment.tracking_url}</a></p>` : ''}
        `;
        try {
          await sendTransactionalEmail(
            { email: emailTo, name: toName },
            `Update on your Zevlin Bike Order #${order?.id}`,
            html
          );
        } catch (e) {
          console.error('Failed to send shipment update email:', e);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update shipment';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ shipmentId: string }> }
) {
  const supabase = await createClient();
  const isAdmin = await requireAdmin(supabase);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { shipmentId } = await ctx.params;
  if (!shipmentId) return NextResponse.json({ error: 'Missing shipmentId' }, { status: 400 });

  try {
    // best-effort: delete events first to avoid FK issues
    await supabase.from('shipment_events').delete().eq('shipment_id', shipmentId);
    const { error } = await supabase.from('shipments').delete().eq('id', shipmentId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete shipment';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
