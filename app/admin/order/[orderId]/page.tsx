import { getOrderById } from "@/app/admin/orders/actions";
import { notFound } from "next/navigation";
import { OrderDetails } from "@/app/admin/orders/components/PackingSlip";
import OrderDetailClientPage from "./OrderDetailClientPage";

type OrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderId } = await params;
  const order = (await getOrderById(orderId)) as OrderDetails | null;

  if (!order) {
    notFound();
  }

  return <OrderDetailClientPage order={order} />;
}
