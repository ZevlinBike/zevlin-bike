"use client";

import { OrderDetails } from "@/app/admin/orders/components/PackingSlip";

import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { PrintModal } from "@/app/admin/orders/components/PrintModal";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { clsx } from "clsx";

export default function OrderDetailClientPage({ order }: { order: OrderDetails }) {
  // Shipping state
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
  type RateOption = {
    rateObjectId: string;
    carrier: string;
    service: string;
    amountCents: number;
    currency: string;
    estimatedDays?: number;
  };

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [rates, setRates] = useState<RateOption[] | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [refunding, setRefunding] = useState(false);

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
      window.location.reload();
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

  async function fetchRates() {
    setLoadingRates(true);
    try {
      const res = await fetch(`/api/shipping/rates`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to get rates");
      setRates(json.rates || []);
      toast.success("Fetched live shipping rates");
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to get rates");
    } finally {
      setLoadingRates(false);
    }
  }

  async function buyLabel(rate: RateOption) {
    setBuying(rate.rateObjectId);
    try {
      const res = await fetch(`/api/shipping/labels`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          // Idempotency for safety on retries
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ orderId: order.id, rateObjectId: rate.rateObjectId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to purchase label");
      toast.success("Label purchased");
      setRates(null);
      await loadShipments();
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to purchase label");
    } finally {
      setBuying(null);
    }
  }

  async function voidLabelById(shipmentId: string) {
    setVoidingId(shipmentId);
    try {
      const res = await fetch(`/api/shipping/labels/void`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shipmentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to void label");
      toast.success("Label voided");
      await loadShipments();
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to void label");
    } finally {
      setVoidingId(null);
    }
  }
  

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
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefund}
              disabled={refunding}
            >
              {refunding ? "Refunding..." : "Refund"}
            </Button>
            <StatusPill status={order.payment_status} />
            <StatusPill status={order.order_status} />
            <StatusPill status={order.shipping_status} />
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
          {/* Shipping */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Shipping</CardTitle>
              <CardDescription>Rates, labels, and tracking.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {shipments.length > 0 ? (
                    <span>{shipments.length} shipment{shipments.length > 1 ? "s" : ""} found</span>
                  ) : (
                    <span>No shipments yet</span>
                  )}
                </div>
                <Button size="sm" onClick={fetchRates} disabled={loadingRates}>
                  {loadingRates ? "Getting rates…" : "Get Rates"}
                </Button>
              </div>

              {/* Rates list */}
              {rates && rates.length > 0 && (
                <div className="space-y-2">
                  {rates.map((r) => (
                    <div key={r.rateObjectId} className="flex items-center justify-between rounded border p-2">
                      <div className="text-sm">
                        <div className="font-medium">
                          {r.carrier} · {r.service}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {money(r.amountCents)}
                          {r.estimatedDays ? ` · ~${r.estimatedDays} day(s)` : ""}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => buyLabel(r)} disabled={buying === r.rateObjectId}>
                        {buying === r.rateObjectId ? "Buying…" : "Buy Label"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Shipments list */}
              <div className="space-y-2">
                {shipments.map((s) => (
                  <div key={s.id} className="rounded border p-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize">{s.status}</Badge>
                          <span>
                            {(s.carrier || "").toUpperCase()} {s.service ? `· ${s.service}` : ""}
                          </span>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 mt-0.5">
                          {s.tracking_number ? (
                            <a className="underline" href={s.tracking_url ?? undefined} target="_blank" rel="noreferrer">
                              {s.tracking_number}
                            </a>
                          ) : (
                            <span>No tracking</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.label_url && (
                          <a className="text-sm underline" href={s.label_url} target="_blank" rel="noreferrer">
                            Download Label
                          </a>
                        )}
                        {s.status === "purchased" && (
                          <Button size="sm" variant="outline" onClick={() => voidLabelById(s.id)} disabled={voidingId === s.id}>
                            {voidingId === s.id ? "Voiding…" : "Void Label"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                    {(() => {
                      const sd = order.shipping_details?.[0];
                      const lines = [
                        sd?.address_line1 ?? order.billing_address_line1,
                        sd?.address_line2 ?? order.billing_address_line2,
                      ].filter(Boolean);
                      return (
                        <>
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

function StatusPill({ status }: { status: string | null }) {
  if (!status) return null;
  const label = formatStatus(status);
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

const formatStatus = (status: string | null) => {
  if (!status) return "";
  return status
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

function pillColor(s: string | null) {
  switch (s) {
    case "paid":
    case "fulfilled":
    case "delivered":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
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
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-gray-300";
  }
}
function dotColor(s: string | null) {
  switch (s) {
    case "paid":
    case "fulfilled":
    case "delivered":
      return "text-emerald-500";
    case "pending_fulfillment":
    case "shipped":
      return "text-blue-500";
    case "pending":
    case "pending_payment":
      return "text-yellow-500";
    case "cancelled":
    case "refunded":
    case "returned":
    case "partially_refunded":
      return "text-amber-500";
    default:
      return "text-gray-400";
  }
}
