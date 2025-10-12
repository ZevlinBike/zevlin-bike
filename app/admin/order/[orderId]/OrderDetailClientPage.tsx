"use client";

import { OrderDetails } from "@/app/admin/orders/components/PackingSlip";

import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { PrintModal } from "@/app/admin/orders/components/PrintModal";
import { CombinedPrintModal } from "@/app/admin/orders/components/CombinedPrintModal";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Printer } from "lucide-react";
import { Truck, Clock, DollarSign, ExternalLink, MoreVertical, Trash2, Eraser } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { clsx } from "clsx";

export default function OrderDetailClientPage({ order: initialOrder }: { order: OrderDetails }) {
  const [order, setOrder] = useState(initialOrder);
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
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingId, setClearingId] = useState<string | null>(null);
  const [refunding, setRefunding] = useState(false);
  // Manual shipment form
  const [mCarrier, setMCarrier] = useState("");
  const [mService, setMService] = useState("");
  const [mTracking, setMTracking] = useState("");
  const [mUrl, setMUrl] = useState("");
  const [mSending, setMSending] = useState(false);

  // Rates wizard state
  type ShippingPackage = {
    id: string;
    name: string;
    length_cm: number;
    width_cm: number;
    height_cm: number;
    weight_g: number;
    is_default: boolean;
  };
  const [wizardOpen, setWizardOpen] = useState(false);
  const [shippingPackages, setShippingPackages] = useState<ShippingPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [orderWeightG, setOrderWeightG] = useState<number | null>(null);
  const [ratesWizard, setRatesWizard] = useState<RateOption[] | null>(null);
  const [loadingWizard, setLoadingWizard] = useState(false);
  const [buyingWizard, setBuyingWizard] = useState<string | null>(null);

  // inches helper currently unused; keep if we later show dims (omit to satisfy lints)
  function ounces(n: number) { return (n / 28.3495).toFixed(1); }

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

  async function openRatesWizard() {
    setWizardOpen(true);
    setLoadingWizard(true);
    setRatesWizard(null);
    setShippingPackages([]);
    setSelectedPackageId("");
    setOrderWeightG(null);
    try {
      const r = await fetch(`/api/shipping/packages`);
      const pkgs = (await r.json()) as ShippingPackage[] | { error: string };
      if (!r.ok || Array.isArray(pkgs) === false) throw new Error((pkgs as { error: string }).error || 'Failed to load packages');
      setShippingPackages(pkgs);
      const def = pkgs.find(p => p.is_default) || pkgs[0];
      if (def) {
        setSelectedPackageId(def.id);
        await getRatesForPackage(def.id);
      } else {
        setLoadingWizard(false);
      }
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to load packages');
      setLoadingWizard(false);
    }
  }

  async function getRatesForPackage(packageId: string) {
    setSelectedPackageId(packageId);
    setLoadingWizard(true);
    setRatesWizard(null);
    try {
      const res = await fetch(`/api/shipping/rates`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, packageId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load rates');
      const sorted = Array.isArray(json.rates)
        ? [...json.rates].sort((a: { amountCents: number }, b: { amountCents: number }) => (a.amountCents || 0) - (b.amountCents || 0))
        : [];
      setRatesWizard(sorted);
      setOrderWeightG(json.totalWeightG || null);
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to load rates');
    } finally {
      setLoadingWizard(false);
    }
  }

  async function buyLabelFromWizard(rate: RateOption) {
    setBuyingWizard(rate.rateObjectId);
    try {
      const res = await fetch(`/api/shipping/labels`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ orderId: order.id, rateObjectId: rate.rateObjectId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to purchase label');
      toast.success('Label purchased');
      setWizardOpen(false);
      await loadShipments();
      await loadOrder();
      if (json.labelUrl) window.open(json.labelUrl, '_blank');
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to purchase label');
    } finally {
      setBuyingWizard(null);
    }
  }

  // Old inline buyLabel removed; wizard handles purchase

  async function createManualShipment() {
    if (!mCarrier || !mTracking) {
      toast.error("Carrier and tracking number are required.");
      return;
    }
    setMSending(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/shipments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ carrier: mCarrier, service: mService || undefined, tracking_number: mTracking, tracking_url: mUrl || undefined, status: 'shipped', email: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save manual shipment');
      toast.success('Manual shipment saved and customer emailed.');
      setMCarrier(''); setMService(''); setMTracking(''); setMUrl('');
      await loadShipments();
      await loadOrder();
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to save manual shipment');
    } finally {
      setMSending(false);
    }
  }

  async function markDelivered(shipmentId: string) {
    try {
      const res = await fetch(`/api/admin/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'delivered', email: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update shipment');
      toast.success('Shipment marked delivered and customer emailed.');
      await loadShipments();
      await loadOrder();
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to update shipment');
    }
  }

  async function clearTracking(shipmentId: string) {
    setClearingId(shipmentId);
    try {
      const res = await fetch(`/api/admin/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tracking_number: null, tracking_url: null, service: null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to clear tracking');
      toast.success('Tracking cleared');
      await loadShipments();
      await loadOrder();
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to clear tracking');
    } finally {
      setClearingId(null);
    }
  }

  async function deleteShipment(shipmentId: string) {
    if (!confirm('Delete this shipment? This cannot be undone.')) return;
    setDeletingId(shipmentId);
    try {
      const res = await fetch(`/api/admin/shipments/${shipmentId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete shipment');
      toast.success('Shipment deleted');
      await loadShipments();
      await loadOrder();
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to delete shipment');
    } finally {
      setDeletingId(null);
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
      await loadOrder();
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
    <div className="">
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
            {(() => {
              const labeled = shipments.filter((s) => !!s.label_url);
              let latestLabelUrl: string | null = null;
              if (labeled.length > 0) {
                latestLabelUrl = labeled
                  .slice()
                  .sort((a, b) => {
                    const ta = a.created_at ? Date.parse(a.created_at) : 0;
                    const tb = b.created_at ? Date.parse(b.created_at) : 0;
                    return tb - ta;
                  })[0].label_url as string;
              }
              const trigger = (
                <Button variant="outline" size="icon" title="Print">
                  <Printer className="h-4 w-4" />
                </Button>
              );
              return latestLabelUrl ? (
                <CombinedPrintModal orderId={order.id} labelUrl={latestLabelUrl} trigger={trigger} />
              ) : (
                <PrintModal orderId={order.id} trigger={trigger} />
              );
            })()}
          </div>
        </div>
      </div>

      {/* Rates Wizard Overlay */}
      <Dialog open={wizardOpen} onOpenChange={(v) => { if (!v) { setWizardOpen(false); } }}>
        <DialogContent className="w-screen h-[100dvh] max-w-[100vw] sm:w-[96vw] sm:h-[92vh] sm:max-w-6xl p-0 overflow-hidden bg-white text-black dark:bg-neutral-950 dark:text-white rounded-none sm:rounded-2xl">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b bg-white/90 backdrop-blur dark:bg-neutral-950/90">
            <DialogHeader className="p-0">
              <DialogTitle className="text-base sm:text-lg font-semibold">Get Rates • Order #{order.id.substring(0,8)}</DialogTitle>
            </DialogHeader>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {order.shipping_details?.[0]?.postal_code || order.billing_postal_code}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 h-[calc(100dvh-56px)] sm:h-[calc(92vh-64px)] overflow-hidden px-4 sm:px-6 pb-4 sm:pb-6">
            {/* Left: Order summary */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 overflow-y-auto pr-1 sm:pr-2">
              <div>
                <div className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Ship To</div>
                <div className="mt-2 sm:mt-3 text-sm leading-relaxed">
                  {(() => {
                    const sd = order.shipping_details?.[0];
                    const name = (order.customers?.first_name || order.customers?.last_name)
                      ? `${order.customers?.first_name ?? ''} ${order.customers?.last_name ?? ''}`.trim()
                      : (sd?.name || order.billing_name || 'Guest');
                    const line1 = sd?.address_line1 ?? order.billing_address_line1;
                    const line2 = sd?.address_line2 ?? order.billing_address_line2;
                    const city = (sd?.city ?? order.billing_city);
                    const state = (sd?.state ?? order.billing_state);
                    const postal = (sd?.postal_code ?? order.billing_postal_code);
                    const country = (sd?.country ?? order.billing_country);
                    return (
                      <address className="not-italic">
                        {name}<br />
                        {line1}{line2 ? (<><br />{line2}</>) : null}<br />
                        {city}, {state} {postal}<br />
                        {country}
                      </address>
                    );
                  })()}
                </div>
              </div>
              <div>
                <div className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Items</div>
                <div className="mt-2 sm:mt-3 border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.line_items.map(li => (
                        <TableRow key={li.id}>
                          <TableCell>{li.products?.name ?? 'Product'}</TableCell>
                          <TableCell className="text-center">{li.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            {/* Right: Package + Rates */}
            <div className="lg:col-span-3 space-y-4 sm:space-y-6 overflow-y-auto pr-1 sm:pr-2">
              <div>
                <div className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Package</div>
                <div className="mt-2 sm:mt-3">
                  <select
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700"
                    value={selectedPackageId}
                    onChange={(e) => getRatesForPackage(e.target.value)}
                    disabled={loadingWizard || shippingPackages.length === 0}
                  >
                    {shippingPackages.length > 0 ? (
                      shippingPackages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({(p.length_cm / 2.54).toFixed(1)}×{(p.width_cm / 2.54).toFixed(1)}×{(p.height_cm / 2.54).toFixed(1)} in · {ounces(p.weight_g)} oz tare)
                        </option>
                      ))
                    ) : (
                      <option>Loading packages…</option>
                    )}
                  </select>
                  {orderWeightG && (
                    <div className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Total weight: {(() => { const oz = orderWeightG / 28.3495; return oz < 16 ? `${oz.toFixed(1)} oz` : `${Math.floor(oz/16)} lb ${(oz%16).toFixed(1)} oz`; })()}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <div className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Rates</div>
                <div className="mt-2 sm:mt-3 space-y-2 pb-4 sm:pb-6">
                  {loadingWizard && <div className="text-sm text-gray-500">Fetching live rates…</div>}
                  {!loadingWizard && !ratesWizard && <div className="text-sm text-gray-500">Select a package to see available rates.</div>}
                  {ratesWizard && ratesWizard.length === 0 && <div className="text-sm text-gray-500">No rates returned for this address/package.</div>}
                  {ratesWizard && ratesWizard.map((r) => (
                    <div key={r.rateObjectId} className="flex items-center justify-between rounded-lg border p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-neutral-900/40 transition-colors">
                      <div className="text-sm">
                        <div className="font-medium text-[15px] sm:text-sm">{r.carrier} · {r.service}</div>
                        <div className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-3">
                          <span className="inline-flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            {new Intl.NumberFormat(undefined, { style: 'currency', currency: r.currency || 'USD' }).format(r.amountCents / 100)}
                          </span>
                          {r.estimatedDays ? (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> ~{r.estimatedDays} day{r.estimatedDays === 1 ? '' : 's'}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Button className="px-4 sm:px-3" size="sm" onClick={() => buyLabelFromWizard(r)} disabled={buyingWizard === r.rateObjectId}>
                        {buyingWizard === r.rateObjectId ? 'Buying…' : 'Buy Label'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
            <CardContent className="space-y-5 overflow-x-auto">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Truck className="h-4 w-4" />
                  {shipments.length > 0 ? (
                    <span className="tabular-nums">{shipments.length} shipment{shipments.length > 1 ? "s" : ""}</span>
                  ) : (
                    <span>No shipments yet</span>
                  )}
                </div>
                <Button size="sm" onClick={openRatesWizard} className="gap-2">
                  <DollarSign className="h-4 w-4" />
                  Get Rates
                </Button>
              </div>

              {/* Rates list moved to overlay wizard */}

              {/* Manual shipment */}
              <div className="space-y-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Manual Shipment</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Carrier</Label>
                    <Input value={mCarrier} onChange={(e) => setMCarrier(e.target.value)} placeholder="UPS/USPS/FedEx" />
                  </div>
                  <div className="space-y-1">
                    <Label>Service (optional)</Label>
                    <Input value={mService} onChange={(e) => setMService(e.target.value)} placeholder="Ground, Priority, etc." />
                  </div>
                  <div className="space-y-1">
                    <Label>Tracking Number</Label>
                    <Input value={mTracking} onChange={(e) => setMTracking(e.target.value)} placeholder="1Z… / 9400…" />
                  </div>
                  <div className="space-y-1">
                    <Label>Tracking URL (optional)</Label>
                    <Input value={mUrl} onChange={(e) => setMUrl(e.target.value)} placeholder="https://…" />
                  </div>
                </div>
                <div>
                  <Button size="sm" onClick={createManualShipment} disabled={mSending}>
                    {mSending ? 'Saving…' : 'Save & Email Customer'}
                  </Button>
                </div>
              </div>

              {/* Shipments list */}
              <div className="space-y-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Shipments</div>
                {shipments.length === 0 && (
                  <div className="rounded-md border p-6 text-sm text-gray-600 dark:text-gray-400 text-center">
                    No shipments yet. Get live rates to create a label.
                  </div>
                )}
                {shipments.map((s) => (
                  <div key={s.id} className="rounded-md border p-3 bg-white dark:bg-neutral-950">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm">
                        <div className="font-medium flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize">{s.status}</Badge>
                          <span className="whitespace-nowrap">
                            {(s.carrier || "").toUpperCase()} {s.service ? `· ${s.service}` : ""}
                          </span>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                          {s.tracking_number ? (
                            <a className="underline inline-flex items-center gap-1 whitespace-nowrap" href={s.tracking_url ?? undefined} target="_blank" rel="noreferrer">
                              {s.tracking_number}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span>No tracking</span>
                          )}
                        </div>
                      </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {s.label_url && (
                          <>
                            <a
                              className="inline-flex items-center gap-1 text-sm underline"
                              href={s.label_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Download Label
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <span className="mx-1 text-gray-300">|</span>
                            <PrintModal
                              orderId={order.id}
                              trigger={<Button size="sm" variant="outline">Packing Slip</Button>}
                            />
                            <CombinedPrintModal
                              orderId={order.id}
                              labelUrl={s.label_url}
                              trigger={<Button size="sm">Print Both</Button>}
                            />
                          </>
                        )}
                        {!s.label_url && s.status !== 'delivered' && (
                          <Button size="sm" variant="outline" onClick={() => markDelivered(s.id)}>Mark Delivered + Email</Button>
                        )}
                        {s.status === "purchased" && (
                          <Button size="sm" variant="outline" onClick={() => voidLabelById(s.id)} disabled={voidingId === s.id}>
                            {voidingId === s.id ? "Voiding…" : "Void Label"}
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Shipment actions">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => clearTracking(s.id)} disabled={clearingId === s.id}>
                              <Eraser className="h-4 w-4" />
                              {clearingId === s.id ? 'Clearing…' : 'Remove tracking only'}
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => deleteShipment(s.id)} disabled={deletingId === s.id}>
                              <Trash2 className="h-4 w-4" />
                              {deletingId === s.id ? 'Deleting…' : 'Delete shipment'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                  <address className="not-italic text-sm text-gray-700 dark:text-gray-300">
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
                  <address className="not-italic text-sm text-gray-700 dark:text-gray-300">
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
