import { getOrders } from "./actions";
import OrderClientPage from "./OrderClientPage";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = Array.isArray(resolvedSearchParams.query) ? resolvedSearchParams.query[0] || '' : resolvedSearchParams.query || '';
  const status = Array.isArray(resolvedSearchParams.status) ? resolvedSearchParams.status[0] || '' : resolvedSearchParams.status || '';

  const orders = await getOrders(query, status);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Orders</h1>
      <OrderClientPage orders={orders} />
    </div>
  );
}
