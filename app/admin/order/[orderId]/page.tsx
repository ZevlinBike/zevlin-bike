import { getOrderById } from "@/app/admin/orders/actions";
import { notFound } from "next/navigation";
import { OrderDetails } from "@/app/admin/orders/components/PackingSlip";
import OrderDetailClientPage from "./OrderDetailClientPage";

export default async function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const order = (await getOrderById(
    params.orderId
  )) as OrderDetails | null;

  if (!order) {
    notFound();
  }

  return <OrderDetailClientPage order={order} />;
}
