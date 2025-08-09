"use client";

import { OrderDetails } from "@/app/admin/orders/components/PackingSlip";
import { updateOrderStatus } from "@/app/admin/orders/actions";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { PrintModal } from "@/app/admin/orders/components/PrintModal";
import { toast } from "sonner";
import { clsx } from "clsx";

type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";



export default function OrderDetailClientPage({ order }: { order: OrderDetails }) {
  const handleStatusChange = async (status: string) => {
    const result = await updateOrderStatus(order.id, status);
    if (result.success) toast.success("Order status updated.");
    else toast.error(result.error || "Failed to update order status.");
  };

  const orderIdShort = order.id.substring(0, 8);
  const orderDate = order.created_at ? new Date(order.created_at).toLocaleString() : "";

  // quick helpers
  const money = (c: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(c / 100);

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-6 md:py-8">
      {/* Page header */}
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              Order <span className="font-mono">#{orderIdShort}</span>
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {orderDate && <>Placed {orderDate}</>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <StatusPill status={order.status as OrderStatus} />
            <PrintModal orderId={order.id} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 grid gap-6">
          {/* Items card */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Order Items</span>
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  {order.line_items.length} {order.line_items.length === 1 ? "item" : "items"}
                </span>
              </CardTitle>
{order.discount_cents > 0 && (
  <span
    className="
      inline-flex items-center gap-1 rounded-full px-2.5 py-1
      text-[11px] font-medium
      bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300
    "
    title={`Discount applied: -${money(order.discount_cents)}`}
  >
    Discount −{money(order.discount_cents)}
  </span>
)}
              <CardDescription>Review the purchased products.</CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              {/* Mobile: cards */}
              <ul className="sm:hidden divide-y divide-gray-100 dark:divide-neutral-800">
                {order.line_items.map((item) => (
                  <li key={item.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium leading-snug">
                          {item.products?.name ?? "Product"}
                        </div>
                        <div className="mt-0.5 text-[12px] text-gray-500">
                          Qty {item.quantity} · {money(item.unit_price_cents)}
                        </div>
                      </div>
                      <div className="text-right font-semibold tabular-nums">
                        {money(item.unit_price_cents * item.quantity)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop: table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-neutral-800/60">
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Line Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.line_items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="line-clamp-2">{item.products?.name ?? "Product"}</div>
                        </TableCell>
                        <TableCell className="text-center tabular-nums">{item.quantity}</TableCell>
                        <TableCell className="text-right tabular-nums">{money(item.unit_price_cents)}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {money(item.unit_price_cents * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>

<CardFooter className="flex justify-end border-t bg-gray-50 dark:bg-neutral-900/40">
  <div className="w-full sm:w-auto py-3 sm:py-4">
    <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:text-base">
      <dt className="text-gray-600 dark:text-gray-400">Subtotal</dt>
      <dd className="text-right tabular-nums">{money(order.subtotal_cents)}</dd>

      <dt className="text-gray-600 dark:text-gray-400">Shipping</dt>
      <dd className="text-right tabular-nums">{money(order.shipping_cost_cents)}</dd>

      <dt className="text-gray-600 dark:text-gray-400">Tax</dt>
      <dd className="text-right tabular-nums">{money(order.tax_cents)}</dd>

      {order.discount_cents > 0 && (
        <>
          <dt className="text-gray-700 dark:text-gray-300">Discount</dt>
          <dd className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
            −{money(order.discount_cents)}
          </dd>
        </>
      )}

      <dt className="mt-1 font-semibold">Total</dt>
      <dd className="mt-1 text-right font-bold tabular-nums">
        {money(order.total_cents)}
      </dd>
    </dl>
  </div>
</CardFooter>

          </Card>
        </div>

        {/* Right column */}
        <div className="grid gap-6">
          {/* Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Order Status</CardTitle>
              <CardDescription>Set the current fulfillment state.</CardDescription>
            </CardHeader>
            <CardContent>
              <Select defaultValue={order.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {["pending", "paid", "fulfilled", "cancelled", "refunded"].map((s) => (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        <Dot className={statusColor(s)} />
                        <span className="capitalize">{s}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Customer</CardTitle>
              <CardDescription>Contact and shipping details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-medium">
                  {order.customers?.first_name} {order.customers?.last_name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {order.customers?.email}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="mb-1 font-medium text-sm">Shipping Address</div>
                  <address className="not-italic text-sm text-gray-700 dark:text-gray-300">
                    {order.billing_address_line1}
                    {order.billing_address_line2 && <> <br />{order.billing_address_line2}</>}
                    <br />
                    {order.billing_city}, {order.billing_state} {order.billing_postal_code}
                    <br />
                    {order.billing_country}
                  </address>
                </div>

                <div>
                  <div className="mb-1 font-medium text-sm">Billing Address</div>
                  <address className="not-italic text-sm text-gray-700 dark:text-gray-300">
                    {order.billing_address_line1}
                    {order.billing_address_line2 && <> <br />{order.billing_address_line2}</>}
                    <br />
                    {order.billing_city}, {order.billing_state} {order.billing_postal_code}
                    <br />
                    {order.billing_country}
                  </address>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Payment</CardTitle>
              <CardDescription>Transaction summary.</CardDescription>
            </CardHeader>
            <CardContent>
              {order.card_last4 ? (
                <p className="text-sm">
                  Paid with card ending in <span className="font-medium">{order.card_last4}</span>
                </p>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">Payment details not available.</p>
              )}
              {order.stripe_payment_intent_id && (
                <p className="mt-1 text-xs text-gray-500">
                  Payment Intent: {order.stripe_payment_intent_id.substring(0, 12)}…
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* --- Small bits --- */

function StatusPill({ status }: { status: OrderStatus }) {
  const label = status?.charAt(0).toUpperCase() + status?.slice(1);
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
        pillColor(status)
      )}
      title={`Status: ${label}`}
    >
      <Dot className={dotColor(status)} />
      {label}
    </span>
  );
}

function Dot({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "inline-block size-2 rounded-full shadow-[0_0_8px_currentColor/50]",
        className
      )}
    />
  );
}

function pillColor(s: string) {
  switch (s) {
    case "paid":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "fulfilled":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "cancelled":
      return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
    case "refunded":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-gray-300";
  }
}
function dotColor(s: string) {
  switch (s) {
    case "paid":
      return "text-emerald-500";
    case "fulfilled":
      return "text-blue-500";
    case "cancelled":
      return "text-rose-500";
    case "refunded":
      return "text-amber-500";
    default:
      return "text-gray-400";
  }
}
function statusColor(s: string) {
  switch (s) {
    case "paid":
      return "text-emerald-500";
    case "fulfilled":
      return "text-blue-500";
    case "cancelled":
      return "text-rose-500";
    case "refunded":
      return "text-amber-500";
    default:
      return "text-gray-400";
  }
}

