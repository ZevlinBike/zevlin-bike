"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderWithLineItems } from "@/lib/schema";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Package,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { requestRefund, updateOrderStatus } from "./actions";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const OrderRow = ({ order }: { order: OrderWithLineItems }) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const [reason, setReason] = useState("");

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    const result = await updateOrderStatus(order.id, 'cancelled');
    if (result.success) {
      toast.success('Order has been cancelled.');
      router.refresh();
    } else {
      toast.error(result.error || 'An unexpected error occurred.');
    }
  };

  const hasPendingOrApprovedRefund = Array.isArray(order.refunds) && order.refunds.some(r => r.status === 'pending' || r.status === 'approved');

  const handleRequestRefund = async () => {
    if (hasPendingOrApprovedRefund) {
      toast.info('A refund has already been requested for this order.');
      return;
    }
    if (!window.confirm("Are you sure you want to request a refund for this order?")) return;
    const trimmed = reason.trim();
    const result = await requestRefund(order.id, trimmed || undefined);
    if (result.success) {
      toast.success('Refund request submitted. We\'ll email you once reviewed.');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to request refund.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "fulfilled":
        return <Package className="w-4 h-4 text-blue-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "refunded":
        return <RefreshCw className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <>
      <TableRow
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800"
      >
        <TableCell className="font-medium">
          #{order.id.substring(0, 8)}
        </TableCell>
        <TableCell>
          {new Date(order.created_at!).toLocaleDateString()}
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className="capitalize flex items-center gap-2"
          >
            {getStatusIcon(order.status)}
            {order.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          ${(order.total_cents / 100).toFixed(2)}
        </TableCell>
        <TableCell className="text-right">
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </TableCell>
      </TableRow>
      <AnimatePresence>
        {isOpen && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 dark:bg-neutral-800/50"
          >
            <TableCell colSpan={5} className="p-0">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="font-semibold">Order Details</h4>
                    {order.line_items.map((item, index) => {
                      if (!item.products) return null;
                      type ProductImage = { url: string; is_featured: boolean };
                      const pi = item.products.product_images as ProductImage | ProductImage[] | null;
                      const list: ProductImage[] = Array.isArray(pi) ? pi : (pi ? [pi] : []);
                      const featured = list.find((im) => im?.is_featured) || list[0];
                      const src = featured?.url || "/images/logo.png";
                      return (
                        <div key={index} className="flex items-center gap-4">
                          <Image
                            src={src}
                            alt={item.products.name}
                            width={64}
                            height={64}
                            className="rounded-md object-cover"
                          />
                          <div>
                            <p className="font-medium">{item.products.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold">Actions</h4>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/order/${order.id}`);
                        }}
                      >
                        <FileText className="w-4 h-4" />
                        View Invoice
                      </Button>
                      {order.status === "paid" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleCancel}
                          className="flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel Order
                        </Button>
                      )}
                      {order.status === "fulfilled" && (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Reason for refund (shared with admin)"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            maxLength={500}
                            className="h-20"
                            disabled={hasPendingOrApprovedRefund}
                          />
                          <div className="text-xs text-gray-500">Max 500 characters.</div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleRequestRefund}
                            disabled={hasPendingOrApprovedRefund}
                            className="flex items-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            {hasPendingOrApprovedRefund ? 'Refund Pending' : 'Request Refund'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TableCell>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
};

export default function OrderHistoryClientPage({
  orders,
}: {
  orders: OrderWithLineItems[];
}) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            Here is a list of your past orders. Click on an order to see more
            details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length > 0 ? (
                orders.map((order) => <OrderRow key={order.id} order={order} />)
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    You have no orders yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
