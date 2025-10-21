"use client";

import { OrderDetails } from "@/app/admin/orders/components/PackingSlip";

import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

// Removed header print actions; printing handled in ShippingCard
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
// import { Printer } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { clsx } from "clsx";
import ShippingCard from "./components/ShippingCard";

export default function OrderDetailClientPage({ order: initialOrder, shipEngineEnabled }: { order: OrderDetails; shipEngineEnabled: boolean }) {
  const [order, setOrder] = useState(initialOrder);
  // Header print modals removed; printing available in ShippingCard
  // Shipping state (for header actions)
  type Shipment = {
    id: string;
    status: string;
    carrier: string | null;
    service: string | null;
    tracking_number: string | null;
    tracking_url: string | null;
    label_url: string | null;
    created_at?: string | null;
  };
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [refunding, setRefunding] = useState(false);
  // Shipment wizard is handled by ShippingCard

  // removed unused ounces helper

  const loadOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load order");
      setOrder(json.order);
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to load order");
    }
  }, [order.id]);

  async function handleRefund() {
    if (!confirm("Are you sure you want to refund this order? This action cannot be undone.")) {
      return;
    }
    setRefunding(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to refund order");
      toast.success("Order refunded successfully.");
      // Refresh the page to show the updated status
      await loadOrder();
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to refund order");
    } finally {
      setRefunding(false);
    }
  }

  const loadShipments = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/shipments`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load shipments");
      setShipments(json.shipments || []);
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to load shipments");
    }
  }, [order.id]);

  useEffect(() => {
    loadShipments();
  }, [order.id, loadShipments]);

  // Deprecated inline shipping functions removed; ShippingCard handles shipment flow

  async function updateShippingStatus(status: 'not_shipped' | 'shipped' | 'delivered' | 'returned' | 'lost') {
    try {
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: [order.id], action: 'set_shipping_status', value: status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update shipping status');
      toast.success(`Order marked ${status.replace('_', ' ')}`);
      await loadOrder();
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to update shipping status');
    }
  }

  // voidLabelById moved to ShippingCard


  const orderIdShort = order.id.substring(0, 8);
  const orderDate = order.created_at
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(order.created_at))
    : "";

  // quick helpers
  const money = (c: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(c / 100);

  return (
    <div>
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
            {/* Status chips moved under title for clarity */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusPill status={order.payment_status} />
              <StatusPill status={order.order_status} />
              <StatusPill status={order.shipping_status} />
              { order.discount_cents > 0 && (<StatusPill status={"discounted"} />)}
              
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefund}
              disabled={refunding}
            >
              {refunding ? "Refunding..." : "Refund"}
            </Button>
            <div className="inline-flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="ml-2">Update Shipping</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => updateShippingStatus('not_shipped')}>Not Shipped</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateShippingStatus('shipped')}>Shipped</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateShippingStatus('delivered')}>Delivered</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateShippingStatus('returned')}>Returned</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateShippingStatus('lost')}>Lost</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Header printing removed; use ShippingCard actions below */}
          </div>
        </div>
      </div>

      {/* Shipment wizard is handled inside the Shipping card */}
      <div className="grid gap-6 lg:grid-cols-3 min-w-0">
        {/* Left column */}
        <div className="lg:col-span-2 grid gap-6 min-w-0">
          {/* Items card */}
          <Card className="overflow-hidden border-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm bg-white/90 dark:bg-neutral-800/60 backdrop-blur supports-[backdrop-filter]:bg-white/70">
            <CardHeader className="pb-3 bg-gradient-to-b from-white/60 to-transparent dark:from-neutral-900/50 dark:to-transparent">
              <CardTitle className="flex items-center justify-between">
                <span>Order Items</span>
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  {order.line_items.length} {order.line_items.length === 1 ? "item" : "items"}
                </span>
              </CardTitle>
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

            <CardFooter className="flex justify-end bg-gray-50/80 dark:bg-neutral-900/40">
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
        <div className="grid gap-6 min-w-0">
          {/* Shipping */}
          <ShippingCard order={order} shipments={shipments} loadShipments={loadShipments} loadOrder={loadOrder} shipEngineEnabled={shipEngineEnabled} />


          {/* Customer */}
          <Card className="border-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm bg-white/90 dark:bg-neutral-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/70">
            <CardHeader className="pb-3 bg-gradient-to-b from-white/60 to-transparent dark:from-neutral-900/50 dark:to-transparent">
              <CardTitle>Customer</CardTitle>
              <CardDescription>Contact and shipping details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-medium">
                  {(() => {
                    const hasCustomerName = (order.customers?.first_name || order.customers?.last_name);
                    if (hasCustomerName) return `${order.customers?.first_name ?? ''} ${order.customers?.last_name ?? ''}`.trim();
                    return order.shipping_details?.[0]?.name || order.billing_name || 'Guest';
                  })()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {order.customers?.email || ''}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="mb-1 font-medium text-sm">Shipping Address</div>
                  <address className="not-italic text-sm text-gray-700 dark:text-gray-300 break-words">
                    {(() => {
                      const sd = order.shipping_details?.[0];
                      const name = (order.customers?.first_name || order.customers?.last_name)
                        ? `${order.customers?.first_name ?? ''} ${order.customers?.last_name ?? ''}`.trim()
                        : (sd?.name || order.billing_name || 'Guest');
                      const lines = [
                        sd?.address_line1 ?? order.billing_address_line1,
                        sd?.address_line2 ?? order.billing_address_line2,
                      ].filter(Boolean);
                      return (
                        <>
                          {name}<br />
                          {lines[0]}
                          {lines[1] && (<><br />{lines[1]}</>)}
                          <br />
                          {(sd?.city ?? order.billing_city)}, {(sd?.state ?? order.billing_state)} {(sd?.postal_code ?? order.billing_postal_code)}
                          <br />
                          {(sd?.country ?? order.billing_country)}
                        </>
                      );
                    })()}
                  </address>
                </div>

                <div>
                  <div className="mb-1 font-medium text-sm">Billing Address</div>
                  <address className="not-italic text-sm text-gray-700 dark:text-gray-300 break-words">
                    {order.billing_name || ''}
                    <br />
                    {order.billing_address_line1}
                    {order.billing_address_line2 && (<><br />{order.billing_address_line2}</>)}
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
          <Card className="border-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm bg-white/90 dark:bg-neutral-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/70">
            <CardHeader className="pb-3 bg-gradient-to-b from-white/60 to-transparent dark:from-neutral-900/50 dark:to-transparent">
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
                  Payment Intent: {order.stripe_payment_intent_id}
                </p>
              )}
              {order.stripe_payment_intent_id && (
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={`https://dashboard.stripe.com/payments/${order.stripe_payment_intent_id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on Stripe
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* --- Small bits --- */

function StatusPill({ status }: { status: string | null }) {
  if (!status) return null;
  const label = formatStatus(status);
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
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

const formatStatus = (status: string | null) => {
  if (!status) return "";
  return status
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// removed unused pillColor
function dotColor(s: string | null) {
  switch (s) {
    case "discounted": 
    case "paid":
    case "fulfilled":
    case "delivered":
      return "bg-emerald-500";
    case "pending_fulfillment":
    case "shipped":
      return "bg-blue-500";
    case "pending":
    case "pending_payment":
      return "bg-yellow-500";
    case "cancelled":
    case "refunded":
    case "returned":
    case "partially_refunded":
      return "bg-amber-500";
    default:
      return "bg-gray-400";
  }
}
