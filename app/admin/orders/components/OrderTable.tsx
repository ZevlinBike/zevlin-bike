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
// Actions removed from table view for simplicity

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
  const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  const handleRowClick = (orderId: string) => {
    router.push(`/admin/order/${orderId}`);
  };

  return (
    <div className=" border bg-white shadow-sm dark:bg-neutral-900">
      <Table className="text-[13px]">
        <TableHeader className="sticky top-0 z-10 bg-gray-50/60 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 dark:bg-neutral-900/60">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 hidden sm:table-cell">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 dark:border-neutral-600"
                onChange={() => onToggleAll?.(orders.map(o => o.id))}
                checked={orders.length > 0 && orders.every((o) => selected?.includes(o.id))}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="uppercase tracking-wider text-xs text-gray-500">Order</TableHead>
            <TableHead className="uppercase tracking-wider text-xs text-gray-500">Customer</TableHead>
            <TableHead className="uppercase tracking-wider text-xs text-gray-500">Date</TableHead>
            <TableHead className="uppercase tracking-wider text-xs text-gray-500 hidden md:table-cell">Payment</TableHead>
            <TableHead className="uppercase tracking-wider text-xs text-gray-500 hidden md:table-cell">Order</TableHead>
            <TableHead className="uppercase tracking-wider text-xs text-gray-500 hidden lg:table-cell">Shipping</TableHead>
            <TableHead className="text-right uppercase tracking-wider text-xs text-gray-500">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              onClick={() => handleRowClick(order.id)}
              className="cursor-pointer hover:bg-gray-50/80 dark:hover:bg-neutral-800/70"
              data-navigates="true"
              role="link"
              aria-label={`Open order ${order.id.substring(0,8)}`}
            >
              <TableCell onClick={(e) => e.stopPropagation()} className="hidden sm:table-cell">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 dark:border-neutral-600"
                  checked={selected?.includes(order.id) || false}
                  onChange={() => onToggle?.(order.id)}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label={`Select ${order.id.substring(0,8)}`}
                />
              </TableCell>
              <TableCell className="font-mono">
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-800 dark:bg-neutral-800 dark:text-gray-200">
                  {order.id.substring(0, 8)}
                </span>
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
                <div className="text-xs text-gray-500 hidden sm:block">
                  {order.customers?.email || ''}
                </div>
              </TableCell>
              <TableCell>
                <div>{new Date(order.created_at!).toLocaleDateString()}</div>
                <div className="text-xs text-gray-500 hidden sm:block">{new Date(order.created_at!).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="secondary" className={getStatusClass(order.payment_status)}>
                  {formatStatus(order.payment_status)}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="secondary" className={getStatusClass(order.order_status)}>
                  {formatStatus(order.order_status)}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Badge variant="secondary" className={getStatusClass(order.shipping_status)}>
                  {formatStatus(order.shipping_status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-semibold">
                {currency.format(order.total_cents / 100)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
