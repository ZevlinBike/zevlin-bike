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
import Link from "next/link";
import { requestRefund } from "./actions";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const statusClass = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'fulfilled':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'cancelled':
    case 'refunded':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
  }
};

const OrderRow = ({ order }: { order: OrderWithLineItems }) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const [reason, setReason] = useState("");

  const handleCancel = async () => {
    if (hasPendingOrApprovedRefund) {
      toast.info('A refund/cancellation request is already pending for this order.');
      return;
    }
    if (!window.confirm("Request cancellation? An admin will review it.")) return;
    const result = await requestRefund(order.id, 'Customer requested order cancellation');
    if (result.success) {
      toast.success("Cancellation request submitted. We'll email you once reviewed.");
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to submit cancellation request.');
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
        className="cursor-pointer hover:bg-gray-50/70 dark:hover:bg-neutral-800/70"
      >
        <TableCell className="font-medium">
          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-[12px] font-mono font-medium text-gray-800 dark:bg-neutral-800 dark:text-gray-200">#{order.id.substring(0, 8)}</span>
        </TableCell>
        <TableCell>
          <div>{new Date(order.created_at!).toLocaleDateString()}</div>
          <div className="text-xs text-gray-500">{new Date(order.created_at!).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className={`capitalize flex items-center gap-2 ${statusClass(order.status)}`}>
            {getStatusIcon(order.status)}
            {order.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right font-semibold">
          {currency.format(order.total_cents / 100)}
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
                    <h4 className="font-semibold tracking-tight">Order Details</h4>
                    {order.line_items.map((item, index) => {
                      if (!item.products) return null;
                      type ProductImage = { url: string; is_featured: boolean };
                      const pi = item.products.product_images as ProductImage | ProductImage[] | null;
                      const list: ProductImage[] = Array.isArray(pi) ? pi : (pi ? [pi] : []);
                      const featured = list.find((im) => im?.is_featured) || list[0];
                      const src = featured?.url || "/images/logo.webp";
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
                    <h4 className="font-semibold tracking-tight">Actions</h4>
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
                          disabled={hasPendingOrApprovedRefund}
                          className="flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          {hasPendingOrApprovedRefund ? 'Cancellation Pending' : 'Request Cancellation'}
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Card className="bg-white/90 backdrop-blur ring-1 ring-black/5 dark:bg-neutral-900/90 dark:ring-white/10">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">Your Orders</CardTitle>
          <CardDescription>
            Track your orders and peek into details. Click any row to expand.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="text-[14px]">
            <TableHeader>
              <TableRow>
                <TableHead className="uppercase tracking-wider text-xs text-gray-500">Order</TableHead>
                <TableHead className="uppercase tracking-wider text-xs text-gray-500">Date</TableHead>
                <TableHead className="uppercase tracking-wider text-xs text-gray-500">Status</TableHead>
                <TableHead className="text-right uppercase tracking-wider text-xs text-gray-500">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length > 0 ? (
                orders.map((order) => <OrderRow key={order.id} order={order} />)
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-40">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">You don&apos;t have any orders yet.</p>
                      <Button asChild size="sm">
                        <Link href="/products">Start shopping</Link>
                      </Button>
                    </div>
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
