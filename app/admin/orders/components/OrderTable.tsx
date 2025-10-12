"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Order, Customer } from "@/lib/schema";
import { PrintModal } from "./PrintModal";

type OrderWithCustomer = Order & {
  customers: Pick<Customer, "first_name" | "last_name" | "email"> | null;
  // Guest display fallbacks
  billing_name?: string | null;
  shipping_details?: { name?: string | null }[];
  is_training?: boolean | null;
  payment_status: string | null;
  order_status: string | null;
  shipping_status: string | null;
};

// Map statuses to utility classes compatible with the Badge component
const getStatusClass = (status: string | null): string => {
  switch (status) {
    case "paid":
    case "fulfilled":
    case "delivered":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "pending_fulfillment":
    case "shipped":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "pending":
    case "pending_payment":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "cancelled":
    case "refunded":
    case "returned":
    case "partially_refunded":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    default:
      return "";
  }
};

const formatStatus = (status: string | null) => {
  if (!status) return "";
  return status
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function OrderTable({
  orders,
  selected = [],
  onToggle,
  onToggleAll,
}: {
  orders: OrderWithCustomer[];
  selected?: string[];
  onToggle?: (id: string) => void;
  onToggleAll?: (ids: string[]) => void;
}) {
  const router = useRouter();

  const handleRowClick = (orderId: string) => {
    router.push(`/admin/order/${orderId}`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                onChange={() => onToggleAll?.(orders.map(o => o.id))}
                checked={orders.length > 0 && orders.every((o) => selected?.includes(o.id))}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Order Status</TableHead>
            <TableHead>Shipping</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              onClick={() => handleRowClick(order.id)}
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              data-navigates="true"
              role="link"
              aria-label={`Open order ${order.id.substring(0,8)}`}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected?.includes(order.id) || false}
                  onChange={() => onToggle?.(order.id)}
                  aria-label={`Select ${order.id.substring(0,8)}`}
                />
              </TableCell>
              <TableCell className="font-mono text-sm">
                {order.id.substring(0, 8)}
              </TableCell>
              <TableCell>
                <div className="font-medium flex items-center gap-2">
                  {(() => {
                    const hasCustomerName = (order.customers?.first_name || order.customers?.last_name);
                    if (hasCustomerName) return `${order.customers?.first_name ?? ''} ${order.customers?.last_name ?? ''}`.trim();
                    return order.shipping_details?.[0]?.name || order.billing_name || 'Guest';
                  })()}
                  {!order.customers && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700 dark:bg-neutral-800 dark:text-gray-300 uppercase tracking-wide">Guest</span>
                  )}
                  {order.is_training && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 uppercase tracking-wide">Test</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {order.customers?.email || ''}
                </div>
              </TableCell>
              <TableCell>
                {new Date(order.created_at!).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={getStatusClass(order.payment_status)}>
                  {formatStatus(order.payment_status)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={getStatusClass(order.order_status)}>
                  {formatStatus(order.order_status)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={getStatusClass(order.shipping_status)}>
                  {formatStatus(order.shipping_status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                ${(order.total_cents / 100).toFixed(2)}
              </TableCell>
              <TableCell
                className="text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <PrintModal orderId={order.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
