import { getOrders } from "./actions";
import OrderClientPage from "./OrderClientPage";
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const query = (sp.query as string) || "";
  const payment_status = (sp.payment_status as string) || "";
  const order_status = (sp.order_status as string) || "";
  const shipping_status = (sp.shipping_status as string) || "";

  const orders = await getOrders(
    query,
    payment_status,
    order_status,
    shipping_status
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Orders</h1>
      <OrderClientPage orders={orders} />
    </div>
  );
}
