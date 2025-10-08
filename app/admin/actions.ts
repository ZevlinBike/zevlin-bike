"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  // Revenue and orders today
  const { data: todayOrders, error: todayOrdersError } = await supabase
    .from("orders")
    .select("total_cents, payment_status, order_status, is_training")
    .gte("created_at", todayIso)
    .eq('is_training', false);

  if (todayOrdersError) {
    console.error("Error fetching today's orders:", todayOrdersError);
  }

  const validTodayOrders = (todayOrders || [])
    .filter(o => o.payment_status === 'paid' && o.order_status !== 'cancelled' && o.order_status !== 'refunded');

  const revenueToday = validTodayOrders.reduce((sum, order) => sum + order.total_cents, 0) / 100;

  const ordersToday = validTodayOrders.length;

  // Avg order value
  const avgOrderValue = ordersToday > 0 ? revenueToday / ordersToday : 0;

  // Unfulfilled orders
  const { count: unfulfilledCount, error: unfulfilledError } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("order_status", "pending_fulfillment")
    .eq('is_training', false);

  if (unfulfilledError) {
    console.error("Error fetching unfulfilled count:", unfulfilledError);
  }

  // Pending payment orders (real only)
  const { count: pendingPaymentCount, error: pendingPaymentError } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('order_status', 'pending_payment')
    .eq('is_training', false);
  if (pendingPaymentError) {
    console.error("Error fetching pending payment count:", pendingPaymentError);
  }

  // Labels created today
  const { count: labelsTodayCount, error: labelsError } = await supabase
    .from("shipments")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayIso);

  if (labelsError) {
    console.error("Error fetching labels count:", labelsError);
  }

  // In-transit orders
  const { count: inTransitCount, error: inTransitError } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("shipping_status", "shipped")
    .eq('is_training', false);

  if (inTransitError) {
    console.error("Error fetching in-transit count:", inTransitError);
  }

  // Exceptions
  const { count: exceptionsCount, error: exceptionsError } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("shipping_status", "lost")
    .eq('is_training', false);

  // Pending refunds (exclude training by joining via order_id when available)
  let pendingRefundsCount = 0;
  try {
    const { count } = await supabase
      .from('refunds')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');
    pendingRefundsCount = count ?? 0;
  } catch (e) {
    console.warn('Failed to fetch pending refunds count', e);
  }

  if (exceptionsError) {
    console.error("Error fetching exceptions count:", exceptionsError);
  }

  return {
    revenueToday,
    ordersToday,
    avgOrderValue,
    unfulfilledCount: unfulfilledCount ?? 0,
    labelsTodayCount: labelsTodayCount ?? 0,
    inTransitCount: inTransitCount ?? 0,
    exceptionsCount: exceptionsCount ?? 0,
    pendingRefundsCount,
    pendingPaymentCount: pendingPaymentCount ?? 0,
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

export type LowStockProduct = {
  slug: string;
  name: string;
  price_cents: number;
};

export async function getLowStockProducts(): Promise<LowStockProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug, name, price_cents")
    .lte("price_cents", 12)
    .order("price_cents", { ascending: true })
    .limit(5);

  if (error) {
    console.error("Error fetching low stock products:", error);
    return [];
  }

  return data;
}

export type Activity = {
  ts: string;
  text: string;
};

export async function getRecentActivity(): Promise<Activity[]> {
  const supabase = await createClient();

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, created_at, total_cents, customers(first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: newCustomers, error: customersError } = await supabase
    .from("customers")
    .select("id, created_at, first_name, last_name")
    .order("created_at", { ascending: false })
    .limit(5);

  if (ordersError || customersError) {
    console.error("Error fetching recent activity:", ordersError || customersError);
    return [];
  }

  type OrderActivity = {
    id: string;
    created_at: string;
    total_cents: number;
    customers: { first_name: string; last_name: string; } | null;
    type: 'order';
  };

  type CustomerActivity = {
    id: string;
    created_at: string;
    first_name: string;
    last_name: string;
    type: 'customer';
  };

  type CombinedActivity = OrderActivity | CustomerActivity;

  const combined: CombinedActivity[] = [
    ...(orders || []).map(o => ({
      ...o,
      type: 'order' as const,
      customers: Array.isArray(o.customers) ? o.customers[0] : o.customers,
    })),
    ...(newCustomers || []).map(c => ({ ...c, type: 'customer' as const })),
  ];

  combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const activity: Activity[] = combined.slice(0, 5).map(item => {
    const ts = new Date(item.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    if (item.type === 'order') {
      const customerName = item.customers ? `${item.customers.first_name} ${item.customers.last_name}` : 'Guest';
      const total = `${(item.total_cents / 100).toFixed(2)}`;
      return { ts, text: `New order from ${customerName} (${total})` };
    } else {
      const customerName = `${item.first_name} ${item.last_name}`;
      return { ts, text: `${customerName} signed up.` };
    }
  });

  return activity;
}
