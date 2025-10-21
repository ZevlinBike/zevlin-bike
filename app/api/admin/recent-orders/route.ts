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
      .select('id, created_at, total_cents, is_training, order_status, payment_status, shipping_status, customers(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(12);
    if (error) throw error;
    const normalized = (data || []).map((row) => ({
      id: row.id,
      created_at: row.created_at,
      total_cents: row.total_cents,
      is_training: !!row.is_training,
      order_status: row.order_status,
      payment_status: row.payment_status,
      shipping_status: row.shipping_status,
      customers: Array.isArray(row.customers) ? (row.customers[0] || null) : row.customers,
    }));
    return NextResponse.json({ orders: normalized });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to load recent orders';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
