import { getOrders } from "./actions";
import OrderClientPage from "./OrderClientPage";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    status?: string;
  };
}) {
  const query = searchParams?.query || "";
  const status = searchParams?.status || "";

  const orders = await getOrders(query, status);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Orders</h1>
      <OrderClientPage orders={orders} />
    </div>
  );
}
