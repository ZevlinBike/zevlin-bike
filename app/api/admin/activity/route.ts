import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRecentActivity } from "@/app/admin/actions";

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
    const activity = await getRecentActivity();
    return NextResponse.json({ activity });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to load activity';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

