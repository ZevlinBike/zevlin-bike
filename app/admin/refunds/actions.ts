"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { RefundStatus } from "@/lib/schema";

export type RefundRow = {
  id: string;
  order_id: string;
  customer_id: string;
  status: RefundStatus;
  amount_cents: number;
  reason: string | null;
  admin_note: string | null;
  created_at: string;
  decided_at: string | null;
  customer: { first_name: string | null; last_name: string | null; email: string | null } | null;
  reviewer?: { first_name: string | null; last_name: string | null; email: string | null } | null;
  orders: { id: string; total_cents: number; payment_status: string | null; order_status: string | null } | null;
};

export async function getRefunds(status: RefundStatus | "all" = "pending"): Promise<RefundRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from('refunds')
    .select('*, customer:customers!refunds_customer_id_fkey(first_name,last_name,email), reviewer:customers!refunds_reviewed_by_customer_id_fkey(first_name,last_name,email), orders(id,total_cents,payment_status,order_status)')
    .order('created_at', { ascending: false });

  if (status !== 'all') query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching refunds:', error);
    return [];
  }
  // Flatten possible arrays from supabase relationship resolution
  type CustomerLite = { first_name: string | null; last_name: string | null; email: string | null } | null;
  type OrderLite = { id: string; total_cents: number; payment_status: string | null; order_status: string | null } | null;
  type RefundRowRaw = Omit<RefundRow, 'customer' | 'reviewer' | 'orders'> & {
    customer: CustomerLite | CustomerLite[] | null;
    reviewer?: CustomerLite | CustomerLite[] | null;
    orders: OrderLite | OrderLite[] | null;
  };

  const rows: RefundRow[] = ((data ?? []) as unknown[]).map((u) => {
    const r = u as RefundRowRaw;
    const customer = Array.isArray(r.customer) ? r.customer[0] : r.customer;
    const reviewer = Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer;
    const orders = Array.isArray(r.orders) ? r.orders[0] : r.orders;
    return { ...r, customer, reviewer, orders } as RefundRow;
  });
  return rows;
}

export async function approveRefund(refundId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Identify admin customer id
  const { data: adminCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  // Get refund with order + customer
  const { data: refund, error: fetchError } = await supabase
    .from('refunds')
    .select('*, customer:customers!refunds_customer_id_fkey(first_name,last_name,email), orders(id,total_cents)')
    .eq('id', refundId)
    .single();

  if (fetchError || !refund) return { error: 'Refund not found' };

  // Update refund row
  const { error: updateError } = await supabase
    .from('refunds')
    .update({ status: 'approved', decided_at: new Date().toISOString(), reviewed_by_customer_id: adminCustomer?.id || null })
    .eq('id', refundId);

  if (updateError) {
    console.error('Failed to approve refund:', updateError);
    return { error: 'Failed to approve refund' };
  }

  // Set order payment_status to refunded
  const { error: orderError } = await supabase
    .from('orders')
    .update({ payment_status: 'refunded' })
    .eq('id', refund.order_id);

  if (orderError) {
    console.error('Failed to update order after refund:', orderError);
    // continue but report
  }

  // Notify customer
  try {
    type SingleRefundRaw = {
      order_id: string;
      amount_cents: number | null;
      customer: { first_name: string | null; last_name: string | null; email: string | null } | { first_name: string | null; last_name: string | null; email: string | null }[] | null;
      orders?: { total_cents: number } | { total_cents: number }[] | null;
    };
    const ref = refund as unknown as SingleRefundRaw;
    const customer = Array.isArray(ref.customer) ? ref.customer[0] : ref.customer;
    const { sendTransactionalEmail } = await import('@/lib/brevo');
    if (customer?.email) {
      await sendTransactionalEmail(
        { email: customer.email, name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() },
        'Your refund has been approved',
        `
          <h2>Refund Approved</h2>
          <p>Your refund request for order <strong>${ref.order_id}</strong> has been approved.</p>
          <p><strong>Amount:</strong> $${(((ref.amount_cents ?? ((Array.isArray(ref.orders) ? ref.orders?.[0]?.total_cents : ref.orders?.total_cents) ?? 0)))/100).toFixed(2)}</p>
          <p>Funds will appear back in your account per your bank/card timelines.</p>
        `
      );
    }
  } catch (e) {
    console.error('Failed to email customer about refund approval:', e);
  }
  // Refresh refunds page
  revalidatePath('/admin/refunds');
  return { success: true };
}

export async function rejectRefund(refundId: string, adminNote?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: adminCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  const { data: refund, error: fetchError } = await supabase
    .from('refunds')
    .select('*, customer:customers!refunds_customer_id_fkey(first_name,last_name,email)')
    .eq('id', refundId)
    .single();

  if (fetchError || !refund) return { error: 'Refund not found' };

  const { error: updateError } = await supabase
    .from('refunds')
    .update({ status: 'rejected', admin_note: adminNote || null, decided_at: new Date().toISOString(), reviewed_by_customer_id: adminCustomer?.id || null })
    .eq('id', refundId);

  if (updateError) {
    console.error('Failed to reject refund:', updateError);
    return { error: 'Failed to reject refund' };
  }

  // Notify customer
  try {
    type SingleRefundRaw = {
      order_id: string;
      customer: { first_name: string | null; last_name: string | null; email: string | null } | { first_name: string | null; last_name: string | null; email: string | null }[] | null;
    };
    const ref = refund as unknown as SingleRefundRaw;
    const customer = Array.isArray(ref.customer) ? ref.customer[0] : ref.customer;
    const { sendTransactionalEmail } = await import('@/lib/brevo');
    if (customer?.email) {
      await sendTransactionalEmail(
        { email: customer.email, name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() },
        'Your refund request was reviewed',
        `
          <h2>Refund Request Update</h2>
          <p>Your refund request for order <strong>${ref.order_id}</strong> was not approved at this time.</p>
          ${adminNote ? `<p><strong>Note:</strong> ${adminNote}</p>` : ''}
          <p>If you have questions, please reply to this email.</p>
        `
      );
    }
  } catch (e) {
    console.error('Failed to email customer about refund rejection:', e);
  }
  // Refresh refunds page
  revalidatePath('/admin/refunds');
  return { success: true };
}
