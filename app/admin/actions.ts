"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();

  // Get total revenue and order count from paid orders
  const { data: paidOrders, error: ordersError } = await supabase
    .from("orders")
    .select("total_cents")
    .eq("status", "paid");

  // Get total customer count
  const { count: customerCount, error: customersError } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true });

  if (ordersError || customersError) {
    console.error("Error fetching dashboard stats:", ordersError || customersError);
    // Return zeroed stats on error
    return {
      totalRevenue: 0,
      orderCount: 0,
      customerCount: 0,
    };
  }

  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total_cents, 0) / 100;
  const orderCount = paidOrders.length;

  return {
    totalRevenue,
    orderCount,
    customerCount: customerCount ?? 0,
  };
}

export type RecentOrder = {
  id: string;
  total_cents: number;
  status: string;
  payment_status: string;
  order_status: string;
  shipping_status: string;
  created_at: string;
  customers: {
    first_name: string;
    last_name: string;
  } | null;
};

export async function getRecentOrders(): Promise<RecentOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, total_cents, status, payment_status, order_status, shipping_status, created_at, customers(first_name, last_name)"
    )
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching recent orders:", error);
    return [];
  }

  type CustomerName = { first_name: string; last_name: string };
  type RecentOrderRow = Omit<RecentOrder, "customers"> & {
    customers: CustomerName | CustomerName[] | null;
  };

  // Normalize embedded customers to a single object (first match) for typing
  const normalized: RecentOrder[] = (data as unknown as RecentOrderRow[]).map((row) => ({
    ...row,
    customers: Array.isArray(row.customers) ? row.customers[0] ?? null : row.customers,
  }));

  return normalized;
}
