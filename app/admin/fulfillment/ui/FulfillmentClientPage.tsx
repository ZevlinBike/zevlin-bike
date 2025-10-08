"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type ShippingDetails = {
  name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

type LineItem = {
  id: string;
  quantity: number;
  unit_price_cents: number;
  products: {
    name: string;
    weight?: number | null;
    weight_unit?: string | null;
  } | null;
}

type OrderRow = {
  id: string;
  status: string;
  created_at: string;
  total_cents: number;
  billing_name?: string | null;
  billing_address_line1?: string | null;
  billing_address_line2?: string | null;
  billing_city?: string | null;
  billing_state?: string | null;
  billing_postal_code?: string | null;
  billing_country?: string | null;
  is_training?: boolean | null;
  customers: { first_name?: string | null; last_name?: string | null; email?: string | null } | null;
  shipping_details?: ShippingDetails[];
  line_items?: LineItem[];
  shipments?: { id: string; status: string; label_url: string | null }[];
};

type RateOption = {
  rateObjectId: string;
  carrier: string;
  service: string;
  amountCents: number;
  currency: string;
  estimatedDays?: number;
};

type ShippingPackage = {
  id: string;
  name: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  weight_g: number;
  is_default: boolean;
};

export default function FulfillmentClientPage({ orders, initialQuery = "", initialDataset = 'real' as 'real' | 'training' | 'all' }: { orders: OrderRow[]; initialQuery?: string; initialDataset?: 'real' | 'training' | 'all' }) {
  const [query, setQuery] = useState(initialQuery);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [rates, setRates] = useState<RateOption[] | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [shippingPackages, setShippingPackages] = useState<ShippingPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [orderWeightG, setOrderWeightG] = useState<number | null>(null);
  const [pkgQuery, setPkgQuery] = useState<string>("");

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardOrderId, setWizardOrderId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<number>(0);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [selectedRate, setSelectedRate] = useState<RateOption | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  function setDataset(ds: 'real'|'training'|'all') {
    const params = new URLSearchParams(searchParams);
    params.set('dataset', ds);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const list = useMemo(() => {
    const unfulfilled = orders || [];
    const q = query.trim().toLowerCase();
    if (!q) return unfulfilled;
    return unfulfilled.filter((o) => {
      const customerName = `${o.customers?.first_name ?? ''} ${o.customers?.last_name ?? ''}`.trim();
      const fallbackName = (o.shipping_details?.[0]?.name || o.billing_name || 'Guest').toString();
      const name = (customerName || fallbackName).toLowerCase();
      const email = (o.customers?.email ?? '').toLowerCase();
      return o.id.includes(q) || name.includes(q) || email.includes(q);
    });
  }, [orders, query]);

  const money = (c: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(c / 100);

  async function openRatesDialog(orderId: string) {
    setOpenOrderId(orderId);
    setRates(null);
    setSelectedPackageId("");
    setOrderWeightG(null);
    setLoadingRates(true); // Start loading indicator immediately
    try {
      const res = await fetch(`/api/shipping/packages`);
      const json = await res.json();
      if (!res.ok) throw new Error((json as { error: string }).error || "Failed to load packages");
      const pkgs: ShippingPackage[] = json;
      
      setShippingPackages(pkgs || []);
      
      const defaultPackage = pkgs?.find(p => p.is_default) || pkgs?.[0];
      
      if (defaultPackage) {
        setSelectedPackageId(defaultPackage.id);
        // Automatically fetch rates for the default package
        await getRatesForPackage(orderId, defaultPackage.id);
      } else {
        setLoadingRates(false); // Stop loading if no packages found
      }
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to load packages");
      setLoadingRates(false);
    }
  }

  async function getRatesForPackage(orderId: string, packageId: string) {
    if (!packageId) {
      setRates([]);
      return;
    }
    setSelectedPackageId(packageId);
    setLoadingRates(true);
    setRates(null);
    try {
      const res = await fetch(`/api/shipping/rates`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, packageId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load rates");
      setRates(json.rates || []);
      setOrderWeightG(json.totalWeightG || null);
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to load rates");
    } finally {
      setLoadingRates(false);
    }
  }

  function inches(n: number) { return (n / 2.54).toFixed(1); }
  function ounces(n: number) { return (n / 28.3495).toFixed(1); }
  function dimWeightLb(p: ShippingPackage) {
    // Dimensional weight (inches^3 / 139) approximation used by many carriers
    const li = Number(inches(p.length_cm));
    const wi = Number(inches(p.width_cm));
    const hi = Number(inches(p.height_cm));
    const dim = (li * wi * hi) / 139;
    return Math.max(dim, 0).toFixed(2);
  }

  async function buyLabel(orderId: string, rate: RateOption) {
    setBuying(rate.rateObjectId);
    try {
      const res = await fetch(`/api/shipping/labels`, {
        method: "POST",
        headers: { "content-type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ orderId, rateObjectId: rate.rateObjectId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to purchase label");
      toast.success("Label purchased");
      if(json.labelUrl) {
        window.open(json.labelUrl, '_blank');
      }
      setOpenOrderId(null);
      setRates(null);
      // Revalidate the page to update the list of orders
      window.location.reload();
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to purchase label");
    } finally {
      setBuying(null);
    }
  }

  return (
    <div className="space-y-6 text-black dark:text-white">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Fulfillment Queue</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input placeholder="Search orders or customers" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full sm:w-72" />
          <Select onValueChange={(v) => setDataset(v as 'real' | 'training' | 'all')} defaultValue={initialDataset}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Dataset" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="real">Real Orders</SelectItem>
              <SelectItem value="training">Test Orders</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild variant="outline"><Link href="/admin/orders">Open Orders</Link></Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders to Fulfill</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Ship To</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((o) => {
                const cust = o.customers;
                const sd = o.shipping_details?.[0];
                const itemsCount = (o.line_items || []).reduce((acc, item) => acc + item.quantity, 0);
                const totalWeight = (o.line_items || []).reduce((acc, item) => {
                  if (!item.products?.weight || !item.products?.weight_unit) {
                    return acc;
                  }
                  let weightInGrams = 0;
                  switch (item.products.weight_unit) {
                    case 'g':
                      weightInGrams = item.products.weight;
                      break;
                    case 'oz':
                      weightInGrams = item.products.weight * 28.3495;
                      break;
                    case 'lb':
                      weightInGrams = item.products.weight * 453.592;
                      break;
                    case 'kg':
                      weightInGrams = item.products.weight * 1000;
                      break;
                  }
                  return acc + weightInGrams * item.quantity;
                }, 0);
                const purchasedShipment = o.shipments?.find(s => s.status === 'purchased');

                let weightDisplay = 'N/A';
                if (totalWeight > 0) {
                  const totalOunces = totalWeight / 28.3495;
                  if (totalOunces < 16) {
                    weightDisplay = `${totalOunces.toFixed(1)} oz`;
                  } else {
                    const pounds = Math.floor(totalOunces / 16);
                    const ounces = totalOunces % 16;
                    weightDisplay = `${pounds} lb ${ounces.toFixed(1)} oz`;
                  }
                }

              return (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">#{o.id.substring(0, 8)}</TableCell>
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                      {(() => {
                        const hasCustomerName = (cust?.first_name || cust?.last_name);
                        if (hasCustomerName) return `${cust?.first_name ?? ''} ${cust?.last_name ?? ''}`.trim();
                        return o.shipping_details?.[0]?.name || o.billing_name || 'Guest';
                      })()}
                      {!cust && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700 uppercase tracking-wide">Guest</span>
                      )}
                      {o.is_training && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase tracking-wide">Test</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{cust?.email || ''}</div>
                  </TableCell>
                  <TableCell className="tabular-nums">{itemsCount}</TableCell>
                    <TableCell className="tabular-nums">
                      {weightDisplay}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="line-clamp-2 max-w-[280px]">
                        {sd?.address_line1}{sd?.address_line2 ? `, ${sd.address_line2}` : ''}, {sd?.city}, {sd?.state} {sd?.postal_code}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{money(o.total_cents)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                {purchasedShipment?.label_url ? (
                  <Button size="sm" variant="outline" asChild>
                    <a href={purchasedShipment.label_url} target="_blank" rel="noopener noreferrer">Print Label</a>
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openRatesDialog(o.id)} disabled={loadingRates && openOrderId === o.id}>
                      Quick Rates
                    </Button>
                    <Button size="sm" onClick={() => {
                      setWizardOrderId(o.id);
                      setWizardStep(0);
                      setSelectedPackageId("");
                      setSelectedRate(null);
                      setWizardError(null);
                      setRates(null);
                      setOrderWeightG(null);
                      setShippingPackages([]);
                      setWizardOpen(true);
                    }}>
                      Fulfillment Wizard
                    </Button>
                  </div>
                )}
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/admin/order/${o.id}`}>Open</Link>
                </Button>
              </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-gray-500">All caught up. Nothing to fulfill.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!openOrderId} onOpenChange={(v) => { if (!v) { setOpenOrderId(null); setRates(null); } }}>
        <DialogContent className="sm:max-w-[560px] bg-white text-black">
          <DialogHeader>
            <DialogTitle>Get Rates for Order #{openOrderId?.substring(0,8)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-6">
            <div>
              <label htmlFor="shipping-package" className="block text-sm font-medium text-gray-700">
                Shipping Container
              </label>
              <select
                id="shipping-package"
                name="shipping-package"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={selectedPackageId}
                onChange={(e) => getRatesForPackage(openOrderId!, e.target.value)}
                disabled={shippingPackages.length === 0}
              >
                {shippingPackages.length > 0 ? (
                  shippingPackages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({(p.length_cm / 2.54).toFixed(1)}x{(p.width_cm / 2.54).toFixed(1)}x{(p.height_cm / 2.54).toFixed(1)} in)
                    </option>
                  ))
                ) : (
                  <option>Loading packages...</option>
                )}
              </select>
            </div>

            {orderWeightG && (
              <div className="text-sm text-gray-600">
                Total calculated weight:
                <span className="font-bold ml-2">
                  {(() => {
                    const totalOunces = orderWeightG / 28.3495;
                    if (totalOunces < 16) return `${totalOunces.toFixed(1)} oz`;
                    const pounds = Math.floor(totalOunces / 16);
                    const ounces = totalOunces % 16;
                    return `${pounds} lb ${ounces.toFixed(1)} oz`;
                  })()}
                </span>
              </div>
            )}

            <div className="space-y-2">
              {loadingRates && <div className="text-sm text-gray-500">Fetching live rates…</div>}
              {!loadingRates && !rates && <div className="text-sm text-gray-500">Select a package to see available rates.</div>}
              {rates && rates.length === 0 && <div className="text-sm text-gray-500">No rates returned for this address/package.</div>}
              {rates && rates.map((r) => (
                <div key={r.rateObjectId} className="flex items-center justify-between rounded border p-2">
                  <div className="text-sm">
                    <div className="font-medium">{r.carrier} · {r.service}</div>
                    <div className="text-gray-600 dark:text-gray-400">{money(r.amountCents)} {r.estimatedDays ? `· ~${r.estimatedDays} day(s)` : ''}</div>
                  </div>
                  <Button size="sm" onClick={() => buyLabel(openOrderId!, r)} disabled={buying === r.rateObjectId}>
                    {buying === r.rateObjectId ? 'Buying…' : 'Buy Label'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wizard Modal */}
      <Dialog open={wizardOpen} onOpenChange={(v) => { if (!v) { setWizardOpen(false); setWizardOrderId(null); setWizardStep(0); setSelectedRate(null); setWizardError(null); } }}>
        <DialogContent className="w-[98vw] max-w-[1600px] h-[94vh] bg-white text-black p-0 overflow-hidden">
          <div className="h-full grid grid-rows-[auto,1fr,auto]">
            <div className="border-b px-5 py-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-extrabold tracking-tight">Fulfillment Wizard</DialogTitle>
                  <p className="text-xs text-gray-600">A guided process to ship an order, step by step.</p>
                </div>
                {wizardOrderId && (
                  <div className="text-xs text-gray-600 font-mono">Order #{wizardOrderId.substring(0,8)}</div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="min-h-0 overflow-y-auto p-5">
              {(() => {
                const order = orders.find(o => o.id === wizardOrderId);
                if (!order) return <div className="text-sm text-gray-500">No order selected.</div>;
                const sd = order.shipping_details?.[0];
                const customerName = (order.customers?.first_name || order.customers?.last_name) ? `${order.customers?.first_name ?? ''} ${order.customers?.last_name ?? ''}`.trim() : (sd?.name || order.billing_name || 'Guest');
                const itemsCount = (order.line_items || []).reduce((acc, i) => acc + i.quantity, 0);

                // steps
                const StepHeader = ({ n, title, subtitle }: { n: number; title: string; subtitle?: string }) => (
                  <div className="mb-4">
                    <div className="inline-flex items-center gap-2 uppercase tracking-wide text-[11px] text-gray-500">
                      <span className="size-5 rounded-full bg-gray-200 text-gray-800 flex items-center justify-center font-bold">{n}</span>
                      <span>{title}</span>
                    </div>
                    {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
                  </div>
                );

                if (wizardStep === 0) {
                  return (
                    <div>
                      <StepHeader n={1} title="Verify Order" subtitle="Confirm recipient, destination, and contents." />
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="rounded border p-3 bg-white">
                          <div className="text-sm font-semibold mb-1">Recipient</div>
                          <div className="text-sm">{customerName}</div>
                          <div className="text-xs text-gray-600">{order.customers?.email || ''}</div>
                        </div>
                        <div className="rounded border p-3 bg-white">
                          <div className="text-sm font-semibold mb-1">Ship To</div>
                          <div className="text-sm">
                            {sd?.address_line1 || order.billing_address_line1}
                            {sd?.address_line2 || order.billing_address_line2 ? (<><br />{sd?.address_line2 || order.billing_address_line2}</>) : null}
                            <br />
                            {(sd?.city || order.billing_city)}, {(sd?.state || order.billing_state)} {(sd?.postal_code || order.billing_postal_code)}
                          </div>
                        </div>
                        <div className="rounded border p-3 bg-white md:col-span-2">
                          <div className="text-sm font-semibold mb-2">Items</div>
                          <div className="text-xs text-gray-600 mb-2">{itemsCount} total item{itemsCount === 1 ? '' : 's'}</div>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {(order.line_items || []).map(it => (
                              <div key={it.id} className="rounded border p-2 flex items-center justify-between">
                                <div className="text-sm">{it.products?.name || 'Item'}</div>
                                <div className="text-xs text-gray-600">Qty {it.quantity}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (wizardStep === 1) {
                  return (
                    <div>
                      <StepHeader n={2} title="Select Package" subtitle="Choose the container. Favorites and default appear first." />
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                          <input
                            className="w-full sm:w-72 h-9 rounded-md border border-gray-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                            placeholder="Search packages by name…"
                            value={pkgQuery}
                            onChange={(e) => setPkgQuery(e.target.value)}
                          />
                          <div className="flex items-center gap-2">
                            <a href="/admin/settings/packages" target="_blank" className="text-xs underline text-blue-600">Manage packages</a>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[52vh] overflow-y-auto pr-1">
                          {(() => {
                            const q = pkgQuery.trim().toLowerCase();
                            let list = shippingPackages.slice();
                            if (q) list = list.filter(p => p.name.toLowerCase().includes(q));
                            // sort: default first, then by name
                            list.sort((a,b) => {
                              const aDef = a.is_default ? 1 : 0;
                              const bDef = b.is_default ? 1 : 0;
                              if (aDef !== bDef) return bDef - aDef;
                              return a.name.localeCompare(b.name);
                            });
                            if (list.length === 0) {
                              return <div className="col-span-full text-sm text-gray-500">No packages match your filters.</div>;
                            }
                            return list.map((p) => {
                              const isSelected = selectedPackageId === p.id;
                              const isDefault = p.is_default;
                              return (
                                <div
                                  key={p.id}
                                  className={`relative rounded-md border p-3 bg-white hover:border-blue-400 transition-colors cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                                  onClick={async () => { setSelectedPackageId(p.id); if (wizardOrderId) { await getRatesForPackage(wizardOrderId, p.id); setWizardStep(2); } }}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedPackageId(p.id); if (wizardOrderId) getRatesForPackage(wizardOrderId, p.id); } }}
                                >
                                  <div>
                                    <div className="font-semibold text-sm">{p.name}</div>
                                    <div className="mt-1 flex items-center gap-2">
                                      {isDefault && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">Default</span>}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      {inches(p.length_cm)}×{inches(p.width_cm)}×{inches(p.height_cm)} in · {ounces(p.weight_g)} oz tare
                                    </div>
                                    <div className="text-[11px] text-gray-500">DIM wt ~ {dimWeightLb(p)} lb</div>
                                  </div>
                                  <div className="mt-3 flex items-center justify-between">
                                    <button className={`text-xs px-2 py-1 rounded ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                                      onClick={async (e) => { e.stopPropagation(); setSelectedPackageId(p.id); if (wizardOrderId) { await getRatesForPackage(wizardOrderId, p.id); setWizardStep(2); } }}>
                                      {isSelected ? 'Selected' : 'Select'}
                                    </button>
                                    {orderWeightG && (
                                      <div className="text-[11px] text-gray-600">
                                        Est. total: {(() => {
                                          const totalOunces = orderWeightG / 28.3495;
                                          if (totalOunces < 16) return `${totalOunces.toFixed(1)} oz`;
                                          const pounds = Math.floor(totalOunces / 16);
                                          const ounces = totalOunces % 16;
                                          return `${pounds} lb ${ounces.toFixed(1)} oz`;
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (wizardStep === 2) {
                  return (
                    <div>
                      <StepHeader n={3} title="Choose Rate" subtitle="Select carrier and service to purchase a label." />
                      <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
                        {loadingRates && <div className="text-sm text-gray-500">Fetching live rates…</div>}
                        {!loadingRates && !rates && <div className="text-sm text-gray-500">Select a package first.</div>}
                        {rates && rates.length === 0 && <div className="text-sm text-gray-500">No rates returned.</div>}
                        {rates && rates.map((r) => (
                          <div key={r.rateObjectId} className={`flex items-center justify-between rounded border p-2 ${selectedRate?.rateObjectId === r.rateObjectId ? 'border-blue-500 bg-blue-50' : ''}`}>
                            <div className="text-sm">
                              <div className="font-medium">{r.carrier} · {r.service}</div>
                              <div className="text-gray-600 dark:text-gray-400">{money(r.amountCents)} {r.estimatedDays ? `· ~${r.estimatedDays} day(s)` : ''}</div>
                            </div>
                            <Button size="sm" variant={selectedRate?.rateObjectId === r.rateObjectId ? 'default' : 'outline'} onClick={() => setSelectedRate(r)}>
                              {selectedRate?.rateObjectId === r.rateObjectId ? 'Selected' : 'Select'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (wizardStep === 3) {
                  return (
                    <div>
                      <StepHeader n={4} title="Confirm & Purchase" subtitle="Review selections and buy the label." />
                      <div className="space-y-3 text-sm">
                        <div className="rounded border p-3">
                          <div className="font-semibold mb-1">Summary</div>
                          <div>Recipient: <span className="font-medium">{customerName}</span></div>
                          <div>Package: <span className="font-medium">{shippingPackages.find(p=>p.id===selectedPackageId)?.name || '—'}</span></div>
                          <div>Weight: <span className="font-medium">{orderWeightG ? `${(orderWeightG/453.592).toFixed(2)} lb` : '—'}</span></div>
                          <div>Service: <span className="font-medium">{selectedRate ? `${selectedRate.carrier} · ${selectedRate.service}` : '—'}</span></div>
                          <div>Price: <span className="font-semibold">{selectedRate ? money(selectedRate.amountCents) : '—'}</span></div>
                        </div>
                        {wizardError && <div className="text-red-600">{wizardError}</div>}
                      </div>
                    </div>
                  );
                }

                if (wizardStep === 4) {
                  return (
                    <div className="text-center py-10">
                      <div className="text-xl font-bold mb-2">Label Purchased</div>
                      <div className="text-sm text-gray-600">Your label is ready. You may print it now.</div>
                    </div>
                  );
                }

                return null;
              })()}
            </div>

            {/* Footer */}
            <div className="border-t px-5 py-3 bg-gray-50 flex items-center justify-between">
              <div className="text-xs text-gray-500">Follow the steps carefully. This action updates order status.</div>
              <div className="flex gap-2">
                {wizardStep > 0 && wizardStep < 4 && (
                  <Button variant="outline" onClick={() => setWizardStep((s) => Math.max(0, s-1))}>Back</Button>
                )}
                {(() => {
                  if (!wizardOrderId) return null;
                  if (wizardStep === 0) {
                    return <Button onClick={async () => {
                      // Load packages on step advance
                      setWizardStep(1);
                      try {
                        const res = await fetch(`/api/shipping/packages`);
                        const json = await res.json();
                        if (!res.ok) throw new Error((json as { error: string }).error || 'Failed to load packages');
                        const pkgs: ShippingPackage[] = json;
                        setShippingPackages(pkgs || []);
                        const def = pkgs?.find(p=>p.is_default) || pkgs?.[0];
                        if (def) {
                          setSelectedPackageId(def.id);
                          await getRatesForPackage(wizardOrderId, def.id);
                        }
                      } catch (e: unknown) {
                        const msg = e instanceof Error ? e.message : 'Failed to load packages';
                        setWizardError(msg);
                      }
                    }}>Continue</Button>;
                  }
                  if (wizardStep === 1) {
                    return <Button onClick={() => setWizardStep(2)} disabled={!selectedPackageId || loadingRates}>Continue</Button>;
                  }
                  if (wizardStep === 2) {
                    return <Button onClick={() => setWizardStep(3)} disabled={!selectedRate}>Continue</Button>;
                  }
                  if (wizardStep === 3) {
                    return <Button onClick={async () => {
                      if (!selectedRate) return; 
                      setBuying(selectedRate.rateObjectId);
                      setWizardError(null);
                      try {
                        const res = await fetch(`/api/shipping/labels`, {
                          method: 'POST',
                          headers: { 'content-type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
                          body: JSON.stringify({ orderId: wizardOrderId, rateObjectId: selectedRate.rateObjectId }),
                        });
                        const json = await res.json();
                        if (!res.ok) throw new Error((json as { error: string }).error || 'Failed to purchase label');
                        setWizardStep(4);
                        // reload page to refresh list after close
                        setTimeout(() => { window.location.reload(); }, 800);
                        if (json.labelUrl) window.open(json.labelUrl, '_blank');
                      } catch (e: unknown) {
                        const msg = e instanceof Error ? e.message : 'Failed to purchase label';
                        setWizardError(msg);
                      } finally {
                        setBuying(null);
                      }
                    }} disabled={!selectedRate || !!buying}>{buying ? 'Purchasing…' : 'Purchase Label'}</Button>;
                  }
                  if (wizardStep === 4) {
                    return <Button onClick={() => setWizardOpen(false)}>Close</Button>;
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
