"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(
  orderId: string,
  status: "cancelled" | "refunded"
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to update an order." };
  }

  // Verify the user owns the order they are trying to update
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, customer_id, payment_status, stripe_payment_intent_id")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return { error: "Order not found." };
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!customer || order.customer_id !== customer.id) {
    return { error: "You are not authorized to update this order." };
  }

  // This path no longer auto-cancels or auto-refunds.
  // For customer-initiated cancellations, we now create a refund request
  // that an admin must review and approve.
  if (status === "refunded") {
    return { error: "Refunds must be requested and approved by an admin." };
  }

  // Create a pending refund request for the full amount instead of cancelling immediately
  try {
    const result = await requestRefund(orderId, 'Customer requested order cancellation');
    if (result?.error) return result;
  } catch (e) {
    console.error('Failed to create cancellation (refund) request:', e);
    return { error: 'Could not submit cancellation request.' };
  }

  // Let the caller refresh their view; no direct order mutation here.
  revalidatePath('/orders');
  return { success: true };
}

// Request a refund: creates a refunds row and notifies admins
export async function requestRefund(
  orderId: string,
  reason?: string
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to request a refund." };

  // Load order and verify ownership, also get amount
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, customer_id, total_cents')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) return { error: "Order not found." };

  const { data: customer } = await supabase
    .from('customers')
    .select('id, first_name, last_name, email')
    .eq('auth_user_id', user.id)
    .single();

  if (!customer || order.customer_id !== customer.id) {
    return { error: "You are not authorized to request a refund for this order." };
  }

  // Create refund (full amount by default)
  const { data: refund, error: insertError } = await supabase
    .from('refunds')
    .insert({
      order_id: order.id,
      customer_id: customer.id,
      amount_cents: order.total_cents,
      reason: reason || null,
      status: 'pending'
    })
    .select('*')
    .single();

  if (insertError) {
    const isPgErr = (err: unknown): err is { code?: string } => {
      return !!err && typeof err === 'object' && 'code' in (err as Record<string, unknown>);
    };
    if (isPgErr(insertError) && insertError.code === '23505') {
      return { error: "A pending refund already exists for this order." };
    }
    console.error('Error creating refund:', insertError);
    return { error: "Could not create refund request." };
  }

  // Notify admins via email
  try {
    // 1) Find admin role
    const { data: adminRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'admin')
      .single();

    if (adminRole) {
      // 2) Admin users
      const { data: adminUserIds } = await supabase
        .from('user_roles')
        .select('customer_id')
        .eq('role_id', adminRole.id);

      const adminIds = (adminUserIds || []).map((ur) => ur.customer_id);
      if (adminIds.length > 0) {
        const { data: admins } = await supabase
          .from('customers')
          .select('email, first_name, last_name')
          .in('id', adminIds);

        const { sendTransactionalEmail } = await import('@/lib/brevo');
        const { env } = await import('@/lib/env');
        const baseUrl = env.APP_URL || '';
        const subject = `Refund requested for Order ${order.id.substring(0, 8)}`;
        const html = `
          <h2>Refund Requested</h2>
          <p><strong>Order:</strong> ${order.id}</p>
          <p><strong>Customer:</strong> ${customer.first_name || ''} ${customer.last_name || ''} (${customer.email})</p>
          <p><strong>Amount:</strong> $${(order.total_cents/100).toFixed(2)}</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p><a href="${baseUrl}/admin/refunds">Review refund requests</a></p>
        `;
        for (const admin of admins || []) {
          if (admin.email) {
            await sendTransactionalEmail(
              { email: admin.email, name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() },
              subject,
              html
            );
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to notify admins for refund request', e);
    // Proceed without failing the request
  }

  return { success: true, refund };
}
