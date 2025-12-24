"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();
  // Debug: capture auth context once per call
  try {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    type MinimalAuthError = { message?: string; status?: number };
    const authErr = (userErr ?? undefined) as unknown as MinimalAuthError | undefined;
    console.log("[admin:getDashboardStats] auth user:", {
      userId: userData?.user?.id ?? null,
      hasError: Boolean(userErr),
      error: authErr ? { message: authErr.message, status: authErr.status } : null,
    });
  } catch (err) {
    console.warn("[admin:getDashboardStats] failed to read auth user", err);
  }

  const logSbError = (label: string, err: unknown, context?: Record<string, unknown>) => {
    try {
      type SupabaseErrorShape = {
        message?: string;
        code?: string;
        details?: string;
        hint?: string;
        status?: number;
      };
      const asObj = (e: unknown): SupabaseErrorShape => {
        if (e && typeof e === 'object') {
          const o = e as Record<string, unknown>;
          return {
            message: typeof o.message === 'string' ? o.message : undefined,
            code: typeof o.code === 'string' ? o.code : undefined,
            details: typeof o.details === 'string' ? o.details : undefined,
            hint: typeof o.hint === 'string' ? o.hint : undefined,
            status: typeof o.status === 'number' ? o.status : undefined,
          };
        }
        return {};
      };
      console.error(label, { ...asObj(err), context: context ?? null });
    } catch {
      console.error(label, err);
    }
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  // Month and year boundaries
  const monthStart = new Date(today);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartIso = monthStart.toISOString();

  const yearStart = new Date(today.getFullYear(), 0, 1);
  yearStart.setHours(0, 0, 0, 0);
  const yearStartIso = yearStart.toISOString();

  // Revenue and orders today
  const { data: todayOrders, error: todayOrdersError } = await supabase
    .from("orders")
    .select("total_cents, payment_status, order_status, is_training")
    .gte("created_at", todayIso)
    .eq('is_training', false);

  if (todayOrdersError) {
    logSbError("[admin:getDashboardStats] Error fetching today's orders", todayOrdersError, { todayIso });
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
    logSbError("[admin:getDashboardStats] Error fetching unfulfilled count", unfulfilledError);
  }

  // Pending payment orders (real only)
  const { count: pendingPaymentCount, error: pendingPaymentError } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('order_status', 'pending_payment')
    .eq('is_training', false);
  if (pendingPaymentError) {
    logSbError("[admin:getDashboardStats] Error fetching pending payment count", pendingPaymentError);
  }

  // Labels created today
  const { count: labelsTodayCount, error: labelsError } = await supabase
    .from("shipments")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayIso);

  if (labelsError) {
    logSbError("[admin:getDashboardStats] Error fetching labels count", labelsError, { todayIso });
  }

  // In-transit orders
  const { count: inTransitCount, error: inTransitError } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("shipping_status", "shipped")
    .eq('is_training', false);

  if (inTransitError) {
    logSbError("[admin:getDashboardStats] Error fetching in-transit count", inTransitError);
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
    console.warn('[admin:getDashboardStats] Failed to fetch pending refunds count', e);
  }

  if (exceptionsError) {
    logSbError("[admin:getDashboardStats] Error fetching exceptions count", exceptionsError);
  }

  // Revenue this month (real, paid, not cancelled/refunded)
  let revenueMonth = 0;
  try {
    const { data: monthOrders } = await supabase
      .from('orders')
      .select('total_cents, payment_status, order_status, is_training, created_at')
      .gte('created_at', monthStartIso)
      .eq('is_training', false);
    const valid = (monthOrders || []).filter(o => o.payment_status === 'paid' && o.order_status !== 'cancelled' && o.order_status !== 'refunded');
    revenueMonth = valid.reduce((sum, o) => sum + (o.total_cents || 0), 0) / 100;
  } catch (e) {
    console.warn('[admin:getDashboardStats] Failed to compute monthly revenue', e);
  }

  // Revenue this year (real, paid, not cancelled/refunded)
  let revenueYear = 0;
  try {
    const { data: yearOrders } = await supabase
      .from('orders')
      .select('total_cents, payment_status, order_status, is_training, created_at')
      .gte('created_at', yearStartIso)
      .eq('is_training', false);
    const valid = (yearOrders || []).filter(o => o.payment_status === 'paid' && o.order_status !== 'cancelled' && o.order_status !== 'refunded');
    revenueYear = valid.reduce((sum, o) => sum + (o.total_cents || 0), 0) / 100;
  } catch (e) {
    console.warn('[admin:getDashboardStats] Failed to compute yearly revenue', e);
  }

  return {
    revenueToday,
    revenueMonth,
    revenueYear,
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

export type ToFulfillOrder = {
  id: string;
  total_cents: number;
  order_status: string;
  shipping_status: string;
  created_at: string;
  customers: { first_name: string; last_name: string } | null;
};

export async function getToFulfillOrders(): Promise<ToFulfillOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id,total_cents,order_status,shipping_status,created_at,customers(first_name,last_name)'
    )
    .eq('order_status', 'pending_fulfillment')
    .eq('is_training', false)
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Error fetching to-fulfill orders:', error);
    return [];
  }

  type C = { first_name: string; last_name: string };
  type Row = Omit<ToFulfillOrder, 'customers'> & { customers: C | C[] | null };
  const normalized: ToFulfillOrder[] = (data as unknown as Row[]).map((row) => ({
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

export type ActivityTagKind = 'payment' | 'order' | 'shipping' | 'test' | 'customer';
export type ActivityTag = { kind: ActivityTagKind; value: string };
export type Activity = {
  ts: string;
  text: string;
  tags?: ActivityTag[];
};

export async function getRecentActivity(): Promise<Activity[]> {
  const supabase = await createClient();

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, created_at, total_cents, is_training, payment_status, order_status, shipping_status, customers(first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: newCustomers, error: customersError } = await supabase
    .from("customers")
    .select("id, created_at, first_name, last_name")
    .order("created_at", { ascending: false })
    .limit(20);

  if (ordersError || customersError) {
    console.error("Error fetching recent activity:", ordersError || customersError);
    return [];
  }

  type OrderActivity = {
    id: string;
    created_at: string;
    total_cents: number;
    is_training?: boolean | null;
    payment_status?: string | null;
    order_status?: string | null;
    shipping_status?: string | null;
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

  const activity: Activity[] = combined.slice(0, 10).map(item => {
    const dt = new Date(item.created_at);
    const timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
    const dateStr = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const ts = `${dateStr} ${timeStr}`;
    if (item.type === 'order') {
      const customerName = item.customers ? `${item.customers.first_name} ${item.customers.last_name}`.trim() : 'Guest';
      const total = (item.total_cents / 100).toFixed(2);
      const shortId = item.id.substring(0, 8);
      const tags: ActivityTag[] = [];
      if (item.is_training) tags.push({ kind: 'test', value: 'test' });
      if (item.payment_status) tags.push({ kind: 'payment', value: item.payment_status });
      if (item.order_status) tags.push({ kind: 'order', value: item.order_status });
      if (item.shipping_status) tags.push({ kind: 'shipping', value: item.shipping_status });
      return { ts, text: `Order #${shortId} • ${customerName} • $${total}`, tags };
    } else {
      const customerName = `${item.first_name} ${item.last_name}`.trim();
      const tags: ActivityTag[] = [{ kind: 'customer', value: 'new' }];
      return { ts, text: `${customerName} signed up`, tags };
    }
  });

  return activity;
}
