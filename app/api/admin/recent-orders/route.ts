import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

async function requireAdmin(supabase: ServerSupabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();
  if (!customer) return false;
  const { data: roles } = await supabase.rpc('get_user_roles', { user_id: customer.id });
  return !!(roles && Array.isArray(roles) && roles.includes('admin'));
}

export async function GET() {
  const supabase = await createClient();
  const isAdmin = await requireAdmin(supabase);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, created_at, total_cents, is_training, order_status, payment_status, shipping_status, billing_name, shipping_details(name), customers(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(12);
    if (error) throw error;
    const normalized = (data || []).map((row) => {
      const customer = Array.isArray(row.customers) ? (row.customers[0] || null) : row.customers;
      const shipping = Array.isArray(row.shipping_details) ? (row.shipping_details[0] || null) : row.shipping_details;
      const customerName = customer ? [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim() : '';
      const fallbackName = (row.billing_name || shipping?.name || '').trim();
      const display_name = customerName || fallbackName || null;
      const guest = !customer;
      return {
        id: row.id,
        created_at: row.created_at,
        total_cents: row.total_cents,
        is_training: !!row.is_training,
        order_status: row.order_status,
        payment_status: row.payment_status,
        shipping_status: row.shipping_status,
        display_name,
        guest,
      } as const;
    });
    return NextResponse.json({ orders: normalized });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to load recent orders';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
