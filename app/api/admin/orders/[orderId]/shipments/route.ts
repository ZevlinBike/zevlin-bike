import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false as const, supabase };

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", auth.user.id)
    .single();
  if (!customer) return { ok: false as const, supabase };

  const { data: roles } = await supabase.rpc("get_user_roles", {
    user_id: customer.id,
  });
  return { ok: !!(roles && roles.includes("admin")), supabase };
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ orderId: string }> }
) {
  const { ok, supabase } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await ctx.params;
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Failed to load shipments" }, { status: 500 });
  return NextResponse.json({ shipments: data || [] });
}

