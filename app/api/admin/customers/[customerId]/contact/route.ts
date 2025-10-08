import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendTransactionalEmail } from '@/lib/brevo';

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

export async function POST(req: NextRequest, ctx: { params: Promise<{ customerId: string }> }) {
  const supabase = await createClient();
  const isAdmin = await requireAdmin(supabase);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { customerId } = await ctx.params;
  if (!customerId) return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });

  let body: { subject?: string; message?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const subject = (body.subject || '').trim();
  const message = (body.message || '').trim();
  if (!subject || !message) return NextResponse.json({ error: 'Subject and message required' }, { status: 400 });

  const { data: customer, error } = await supabase
    .from('customers')
    .select('email, first_name, last_name')
    .eq('id', customerId)
    .single();
  if (error || !customer || !customer.email) {
    return NextResponse.json({ error: 'Customer not found or no email' }, { status: 404 });
  }

  try {
    await sendTransactionalEmail(
      { email: customer.email, name: `${customer.first_name} ${customer.last_name}` },
      subject,
      `<p>${message.replace(/\n/g, '<br/>')}</p>`
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to send email';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

