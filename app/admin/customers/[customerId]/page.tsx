import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import CustomerProfileClient from "./profile.client";

type PageProps = { params: Promise<{ customerId: string }> };

export default async function CustomerProfilePage({ params }: PageProps) {
  const { customerId } = await params;
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : await createClient();

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (!customer) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Customer Not Found</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">We couldn’t find that customer.</p>
      </div>
    );
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_cents, created_at, payment_status, order_status, shipping_status')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  return (
    <CustomerProfileClient customer={customer} orders={orders || []} />
  );
}
