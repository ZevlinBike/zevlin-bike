"use client";

import { createClient } from "@/lib/supabase/client";

export async function hasAdminRole(): Promise<boolean> {
  try {
    const supabase = createClient();
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

    return Array.isArray(roles) && roles.includes("admin");
  } catch {
    return false;
  }
}

