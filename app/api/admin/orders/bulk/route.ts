import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

type BulkAction = 'set_training' | 'set_order_status' | 'set_shipping_status' | 'set_payment_status';
type BulkPayload = { ids: string[]; action: BulkAction; value?: string | boolean };

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const isAdmin = await requireAdmin(supabase);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let bodyUnknown: unknown;
  try { bodyUnknown = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const b = bodyUnknown as Partial<BulkPayload> | null;
  const ids = Array.isArray(b?.ids) ? b!.ids : [];
  const action = (b?.action ?? '') as BulkAction;
  const value = b?.value;
  if (!ids.length || !action) return NextResponse.json({ error: 'ids and action are required' }, { status: 400 });

  try {
    switch (action) {
      case 'set_training': {
        const is_training = Boolean(value);
        const { error } = await supabase.from('orders').update({ is_training }).in('id', ids);
        if (error) throw error;
        break;
      }
      case 'set_order_status': {
        const allowed = ['pending_payment','pending_fulfillment','fulfilled','cancelled'] as const;
        if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) return NextResponse.json({ error: 'Invalid order_status' }, { status: 400 });
        const { error } = await supabase.from('orders').update({ order_status: value as (typeof allowed)[number] }).in('id', ids);
        if (error) throw error;
        break;
      }
      case 'set_shipping_status': {
        const allowed = ['not_shipped','shipped','delivered','returned','lost'] as const;
        if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) return NextResponse.json({ error: 'Invalid shipping_status' }, { status: 400 });
        const { error } = await supabase.from('orders').update({ shipping_status: value as (typeof allowed)[number] }).in('id', ids);
        if (error) throw error;
        break;
      }
      case 'set_payment_status': {
        const allowed = ['pending','paid','partially_refunded','refunded'] as const;
        if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) return NextResponse.json({ error: 'Invalid payment_status' }, { status: 400 });
        const { error } = await supabase.from('orders').update({ payment_status: value as (typeof allowed)[number] }).in('id', ids);
        if (error) throw error;
        break;
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Bulk action failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
