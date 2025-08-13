// app/api/admin/orders/[orderId]/route.ts
import { getOrderById } from "@/app/admin/orders/actions";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// createClient() is async, so await its return type
type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

async function requireAdmin(supabase: ServerSupabase) {
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

  return !!(roles && Array.isArray(roles) && roles.includes("admin"));
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ orderId: string }> }
) {
  const supabase = await createClient();

  const isAdmin = await requireAdmin(supabase);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await ctx.params;
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch order";
    console.error(`Failed to fetch order ${orderId}:`, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

