"use server";

import { createClient } from "@/lib/supabase/server";

export async function checkAdminRole(): Promise<{ isAdmin: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false };
  }

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (customerError || !customer) {
    return { isAdmin: false };
  }

  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('customer_id', customer.id);

  if (rolesError) {
    return { isAdmin: false };
  }

  const isAdmin = userRoles?.some(userRole => (userRole.roles as any)?.name === 'admin');

  return { isAdmin: !!isAdmin };
}
