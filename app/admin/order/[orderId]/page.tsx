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

  console.info({shipments: order?.shipments})

  if (!order) {
    notFound();
  }

  const shipEngineEnabled = process.env.NODE_ENV === 'development';
  return <OrderDetailClientPage order={order} shipEngineEnabled={shipEngineEnabled} />;
}
