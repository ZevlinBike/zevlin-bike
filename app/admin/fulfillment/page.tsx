import { createClient } from "@/lib/supabase/server";
import FulfillmentClientPage from "./ui/FulfillmentClientPage";

type ShippingDetails = {
  name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
};

type LineItem = {
  id: string;
  quantity: number;
  unit_price_cents: number;
  products: {
    name: string;
    weight?: number | null;
    weight_unit?: string | null;
  } | null;
};

type OrderRow = {
  id: string;
  status: string;
  created_at: string;
  total_cents: number;
  billing_name?: string | null;
  customers: { first_name?: string | null; last_name?: string | null; email?: string | null } | null;
  shipping_details?: ShippingDetails[];
  line_items?: LineItem[];
  shipments?: { id: string; status: string; label_url: string | null }[];
};

export default async function FulfillmentPage({
  searchParams,
}: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = (await searchParams) || {};
  const initialQuery = (sp.q as string) || "";
  const dataset = ((sp.dataset as string) || 'real') as 'real' | 'training' | 'all';
  const supabase = await createClient();

  let qb = supabase
    .from("orders")
    .select(`
      *,
      customers(first_name, last_name, email),
      shipping_details(*),
      line_items(*, products(name, weight, weight_unit)),
      shipments(id, status, label_url)
    `)
    .eq("order_status", "pending_fulfillment")
    .order("created_at", { ascending: false })
    .limit(100);

  if (dataset === 'real') {
    qb = qb.eq('is_training', false);
  } else if (dataset === 'training') {
    qb = qb.eq('is_training', true);
  }

  const { data: orders } = await qb;

  type CustomerName = { first_name?: string | null; last_name?: string | null; email?: string | null };
  type RawOrderRow = Omit<OrderRow, "customers"> & { customers: CustomerName | CustomerName[] | null };

  const normalized: OrderRow[] = ((orders || []) as unknown as RawOrderRow[]).map((row) => ({
    ...row,
    customers: Array.isArray(row.customers) ? row.customers[0] ?? null : row.customers,
  }));

  return <FulfillmentClientPage orders={normalized} initialQuery={initialQuery} initialDataset={dataset} />;
}
