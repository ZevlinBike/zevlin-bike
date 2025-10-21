"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Clock, DollarSign, Truck } from "lucide-react";
import type { OrderDetails } from "@/app/admin/orders/components/PackingSlip";

type ShippingPackage = {
  id: string;
  name: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  weight_g: number;
  is_default: boolean;
};

type RateOption = {
  rateObjectId: string;
  carrier: string;
  service: string;
  amountCents: number;
  currency: string;
  estimatedDays?: number;
};

function formatOz(weightG: number | null | undefined) {
  if (!weightG) return "";
  const oz = weightG / 28.3495;
  if (oz < 16) return `${oz.toFixed(1)} oz`;
  const lb = Math.floor(oz / 16);
  const rem = oz % 16;
  return `${lb} lb ${rem.toFixed(1)} oz`;
}

export function ShipmentWizard({
  order,
  open,
  onOpenChange,
  onComplete,
  shipEngineEnabled,
}: {
  order: OrderDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => Promise<void> | void;
  shipEngineEnabled?: boolean;
}) {
  const shipEngineOn = !!shipEngineEnabled;
  // Mode selection
  type Mode = "shippo" | "shipengine" | "manual" | null;
  const [mode, setMode] = useState<Mode>(null);

  // Step control per mode
  const [step, setStep] = useState(0);

  // Shippo flow state
  const [packages, setPackages] = useState<ShippingPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [rates, setRates] = useState<RateOption[] | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [buyingRateId, setBuyingRateId] = useState<string | null>(null);
  const [totalWeightG, setTotalWeightG] = useState<number | null>(null);

  // Manual flow state
  const [mCarrier, setMCarrier] = useState("");
  const [mService, setMService] = useState("");
  const [mTracking, setMTracking] = useState("");
  const [mUrl, setMUrl] = useState("");
  const [mSaving, setMSaving] = useState(false);

  // ShipEngine flow state (track which rate is buying)
  const [seBuyingRateId, setSeBuyingRateId] = useState<string | null>(null);
  // ShipStation flow state placeholders removed

  // Reset wizard on open/close
  useEffect(() => {
    if (!open) {
      setMode(null);
      setStep(0);
      setPackages([]);
      setSelectedPackageId("");
      setRates(null);
      setLoadingRates(false);
      setBuyingRateId(null);
      setTotalWeightG(null);
      setMCarrier(""); setMService(""); setMTracking(""); setMUrl(""); setMSaving(false);
      setSeBuyingRateId(null);
    }
  }, [open]);

  // Memoized loaders for rates (defined before effects that depend on them)
  const fetchRates = useCallback(async (packageId: string) => {
    setSelectedPackageId(packageId);
    setLoadingRates(true);
    setRates(null);
    try {
      const res = await fetch(`/api/shipping/rates`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: order.id, packageId }),
      });
      let json: unknown = null;
      try {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          json = await res.json();
        } else {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
      } catch {
        if (res.ok) {
          throw new Error('Invalid JSON response from rates endpoint');
        }
        const text = await res.text().catch(() => '');
        throw new Error(((json as Record<string, unknown>) && (json as Record<string, unknown>).error as string) || text || `HTTP ${res.status}`);
      }
      if (!res.ok) throw new Error((json as Record<string, unknown>).error as string || "Failed to load rates");
      const sorted = Array.isArray((json as Record<string, unknown>).rates)
        ? [...(json as Record<string, RateOption[]>).rates].sort((a: RateOption, b: RateOption) => (a.amountCents || 0) - (b.amountCents || 0))
        : [];
      setRates(sorted);
      setTotalWeightG((json as Record<string, unknown>).totalWeightG as number | null || null);
      setStep(2); // move to rates step automatically
    } catch (e) {
      toast.error((e as Error).message || "Failed to load rates");
    } finally {
      setLoadingRates(false);
    }
  }, [order.id]);

  const fetchShipEngineRates = useCallback(async (packageId: string) => {
    setSelectedPackageId(packageId);
    setLoadingRates(true);
    setRates(null);
    try {
      const res = await fetch(`/api/shipping/shipengine/rates`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: order.id, packageId }),
      });
      let json: unknown = null;
      try {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          json = await res.json();
        } else {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
      } catch {
        if (res.ok) {
          throw new Error('Invalid JSON response from ShipEngine rates');
        }
        const text = await res.text().catch(() => '');
        throw new Error(((json as Record<string, unknown>) && (json as Record<string, unknown>).error as string) || text || `HTTP ${res.status}`);
      }
      if (!res.ok) throw new Error((json as Record<string, unknown>).error as string || "Failed to load ShipEngine rates");
      const sorted = Array.isArray((json as Record<string, unknown>).rates)
        ? [...(json as Record<string, RateOption[]>).rates].sort((a: RateOption, b: RateOption) => (a.amountCents || 0) - (b.amountCents || 0))
        : [];
      setRates(sorted);
      setTotalWeightG((json as Record<string, unknown>).totalWeightG as number | null || null);
      setStep(2);
    } catch (e) {
      toast.error((e as Error).message || "Failed to load ShipEngine rates");
    } finally {
      setLoadingRates(false);
    }
  }, [order.id]);

  // Load packages when shippo mode selected
  useEffect(() => {
    async function run() {
      if (mode !== "shippo" || !open) return;
      setLoadingRates(true);
      setRates(null);
      try {
        const r = await fetch(`/api/shipping/packages`);
        const pkgs = (await r.json()) as ShippingPackage[] | { error: string };
        if (!r.ok || Array.isArray(pkgs) === false) throw new Error((pkgs as { error: string }).error || "Failed to load packages");
        setPackages(pkgs);
        const def = pkgs.find(p => p.is_default) || pkgs[0];
        if (def) {
          setSelectedPackageId(def.id);
          await fetchRates(def.id);
        }
      } catch (e) {
        toast.error((e as Error).message || "Failed to load packages");
      } finally {
        setLoadingRates(false);
      }
    }
    run();
  }, [mode, open, /* include to satisfy hooks rule */ fetchRates]);

  // Load packages when shipengine mode selected
  useEffect(() => {
    async function run() {
      if (mode !== "shipengine" || !open) return;
      setLoadingRates(true);
      setRates(null);
      try {
        const r = await fetch(`/api/shipping/packages`);
        const pkgs = (await r.json()) as ShippingPackage[] | { error: string };
        if (!r.ok || Array.isArray(pkgs) === false) throw new Error((pkgs as { error: string }).error || "Failed to load packages");
        setPackages(pkgs);
        const def = pkgs.find(p => p.is_default) || pkgs[0];
        if (def) {
          setSelectedPackageId(def.id);
          await fetchShipEngineRates(def.id);
        }
      } catch (e) {
        toast.error((e as Error).message || "Failed to load packages");
      } finally {
        setLoadingRates(false);
      }
    }
    run();
  }, [mode, open, /* include to satisfy hooks rule */ fetchShipEngineRates]);

  

  async function buyLabel(rate: RateOption) {
    setBuyingRateId(rate.rateObjectId);
    try {
      const res = await fetch(`/api/shipping/labels`, {
        method: "POST",
        headers: { "content-type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ orderId: order.id, rateObjectId: rate.rateObjectId }),
      });
    let json: unknown = null;
      try {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          json = await res.json();
        } else {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
      } catch {
        if (res.ok) {
          throw new Error('Invalid JSON response from label purchase');
        }
        const text = await res.text().catch(() => '');
        throw new Error(((json as Record<string, unknown>) && (json as Record<string, unknown>).error as string) || text || `HTTP ${res.status}`);
      }
      if (!res.ok) throw new Error((json as Record<string, unknown>).error as string || "Failed to purchase label");
      toast.success("Label purchased");
      // Ensure label URL is saved and visible: open if available; otherwise, resolve and persist
      if ((json as Record<string, unknown>).labelUrl) {
        try { window.open((json as Record<string, unknown>).labelUrl as string, "_blank"); } catch {}
      } else if ((json as Record<string, unknown>).shipmentId) {
        try {
          const r2 = await fetch(`/api/shipping/labels/ensure-url`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ shipmentId: (json as Record<string, unknown>).shipmentId }),
          });
          const j2 = await r2.json().catch(() => ({} as Record<string, unknown>));
          if (r2.ok && (j2 as Record<string, unknown>).labelUrl) {
            try { window.open((j2 as Record<string, unknown>).labelUrl as string, "_blank"); } catch {}
          }
        } catch {}
      }
      await onComplete?.();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || "Failed to purchase label");
    } finally {
      setBuyingRateId(null);
    }
  }

  // ShipStation label creation disabled in UI for now

  // removed unused parseCodes helper

  async function buyLabelShipEngine(rate: RateOption) {
    setSeBuyingRateId(rate.rateObjectId);
    try {
      const res = await fetch(`/api/shipping/shipengine/labels`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          rateId: rate.rateObjectId,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to create ShipEngine label');
      toast.success('ShipEngine label created');
      if (json.labelUrl) {
        try { window.open(json.labelUrl, '_blank'); } catch {}
      }
      await onComplete?.();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to create ShipEngine label');
    } finally {
      setSeBuyingRateId(null);
    }
  }

  async function saveManualShipment() {
    if (!mCarrier || !mTracking) {
      toast.error("Carrier and tracking number are required.");
      return;
    }
    setMSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/shipments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ carrier: mCarrier, service: mService || undefined, tracking_number: mTracking, tracking_url: mUrl || undefined, status: "shipped", email: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save manual shipment");
      toast.success("Manual shipment saved and customer emailed.");
      await onComplete?.();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || "Failed to save manual shipment");
    } finally {
      setMSaving(false);
    }
  }

  const ShipTo = useMemo(() => {
    const sd = order.shipping_details?.[0];
    const name = (order.customers?.first_name || order.customers?.last_name)
      ? `${order.customers?.first_name ?? ""} ${order.customers?.last_name ?? ""}`.trim()
      : (sd?.name || order.billing_name || "Guest");
    const addr1 = sd?.address_line1 ?? order.billing_address_line1;
    const addr2 = sd?.address_line2 ?? order.billing_address_line2;
    const city = sd?.city ?? order.billing_city;
    const state = sd?.state ?? order.billing_state;
    const postal = sd?.postal_code ?? order.billing_postal_code;
    const country = sd?.country ?? order.billing_country;
    return { name, addr1, addr2, city, state, postal, country };
  }, [order]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-[100dvh] max-w-[100vw] sm:w-[96vw] sm:h-[92vh] sm:max-w-6xl p-0 overflow-hidden bg-white text-black dark:bg-neutral-950 dark:text-white rounded-none sm:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b bg-white/90 backdrop-blur dark:bg-neutral-950/90">
          <DialogHeader className="p-0">
            <DialogTitle className="text-base sm:text-lg font-semibold">Create Shipment • Order #{order.id.substring(0,8)}</DialogTitle>
          </DialogHeader>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {formatOz(totalWeightG)}
          </div>
        </div>

        {/* Body grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 h-[calc(100dvh-56px)] sm:h-[calc(92vh-64px)] overflow-hidden px-4 sm:px-6 pb-4 sm:pb-6">
          {/* Left: Shipping summary */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 overflow-y-auto pr-1 sm:pr-2">
            <div>
              <div className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Ship To</div>
              <div className="mt-2 sm:mt-3 text-sm leading-relaxed">
                <div className="font-medium">{ShipTo.name}</div>
                <div>{ShipTo.addr1}</div>
                {ShipTo.addr2 && <div>{ShipTo.addr2}</div>}
                <div>{ShipTo.city}, {ShipTo.state} {ShipTo.postal}</div>
                <div>{ShipTo.country}</div>
              </div>
            </div>
            <div>
              <div className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Items</div>
              <ul className="mt-2 sm:mt-3 space-y-1 text-sm">
                {order.line_items.map((li) => (
                  <li key={li.id} className="flex items-center justify-between">
                    <div className="truncate pr-2">{li.products?.name ?? "Product"}</div>
                    <div className="text-gray-600 dark:text-gray-400 tabular-nums">×{li.quantity}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Wizard */}
      <div className="lg:col-span-3 overflow-y-auto">
            {/* Stepper */}
            <div className="flex items-center gap-2 text-xs sm:text-sm mb-4">
              {mode === null && <div className="font-medium">Select a method</div>}
              {mode === "shippo" && (
                <div className="flex items-center gap-2">
                  <span className={"inline-flex h-6 items-center gap-1 rounded-full px-2.5 bg-gray-100 dark:bg-neutral-900 text-gray-700 dark:text-gray-300"}><Truck className="h-3.5 w-3.5" /> Shippo</span>
                  <span>•</span>
                  <span className={step < 1 ? "font-medium" : ""}>Package</span>
                  <span>→</span>
                  <span className={step >= 2 ? "font-medium" : ""}>Rates</span>
                </div>
              )}
              {mode === "manual" && <div className="font-medium">Manual • Enter details</div>}
            </div>

            {/* Mode select */}
            {mode === null && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="rounded-lg border p-4 text-left hover:bg-gray-50 dark:hover:bg-neutral-900/40" onClick={() => { setMode("shippo"); setStep(1); }}>
                  <div className="font-semibold mb-1">Use Shippo</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Fetch live rates, buy a label, and email tracking automatically.</p>
                </button>
                <button
                  className={
                    "rounded-lg border p-4 text-left hover:bg-gray-50 dark:hover:bg-neutral-900/40 " +
                    (!shipEngineOn ? "opacity-50 cursor-not-allowed pointer-events-none blur-[0.25px]" : "")
                  }
                  disabled={!shipEngineOn}
                  onClick={() => { if (shipEngineOn) { setMode("shipengine"); setStep(1); } }}
                  title={shipEngineOn ? undefined : "Disabled outside development"}
                >
                  <div className="font-semibold mb-1">Use ShipEngine</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get rates and buy a label via ShipEngine.
                    {!shipEngineEnabled && " (Disabled for now)"}
                  </p>
                </button>
                <button className="rounded-lg border p-4 text-left hover:bg-gray-50 dark:hover:bg-neutral-900/40" onClick={() => { setMode("manual"); setStep(1); }}>
                  <div className="font-semibold mb-1">Enter Manually</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Record carrier + tracking and email the customer.</p>
                </button>
              </div>
            )}

            {/* Shippo: package + rates */}
            {mode === "shippo" && (
              <div className="space-y-5">
                {/* Package */}
                <div>
                  <div className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Package Preset</div>
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      className="w-full rounded-md border bg-white dark:bg-neutral-950 px-2 py-2 text-sm"
                      value={selectedPackageId}
                      onChange={(e) => fetchRates(e.target.value)}
                      disabled={loadingRates || packages.length === 0}
                    >
                      {packages.length > 0 ? (
                        packages.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({(p.length_cm / 2.54).toFixed(1)}×{(p.width_cm / 2.54).toFixed(1)}×{(p.height_cm / 2.54).toFixed(1)} in · {formatOz(p.weight_g)})
                          </option>
                        ))
                      ) : (
                        <option>Loading packages…</option>
                      )}
                    </select>
                    {totalWeightG && (
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatOz(totalWeightG)}</div>
                    )}
                  </div>
                </div>

                {/* Rates */}
                <div>
                  <div className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Rates</div>
                  <div className="mt-2 sm:mt-3 space-y-2">
                    {loadingRates && <div className="text-sm text-gray-500">Fetching live rates…</div>}
                    {!loadingRates && !rates && <div className="text-sm text-gray-500">Select a package to see available rates.</div>}
                    {rates && rates.length === 0 && <div className="text-sm text-gray-500">No rates returned for this address/package.</div>}
                    {rates && rates.map((r) => (
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
                        <Button size="sm" onClick={() => buyLabel(r)} disabled={buyingRateId === r.rateObjectId}>
                          {buyingRateId === r.rateObjectId ? "Buying…" : "Buy Label"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {mode === "shipengine" && (
              <div className="space-y-5">
                {/* Package */}
                <div>
                  <div className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Package Preset</div>
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      className="w-full rounded-md border bg-white dark:bg-neutral-950 px-2 py-2 text-sm"
                      value={selectedPackageId}
                      onChange={(e) => fetchShipEngineRates(e.target.value)}
                      disabled={loadingRates || packages.length === 0}
                    >
                      {packages.length > 0 ? (
                        packages.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({(p.length_cm / 2.54).toFixed(1)}×{(p.width_cm / 2.54).toFixed(1)}×{(p.height_cm / 2.54).toFixed(1)} in · {formatOz(p.weight_g)})
                          </option>
                        ))
                      ) : (
                        <option>Loading packages…</option>
                      )}
                    </select>
                    {totalWeightG && (
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatOz(totalWeightG)}</div>
                    )}
                  </div>
                </div>

                {/* Rates */}
                <div>
                  <div className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Rates</div>
                  <div className="mt-2 sm:mt-3 space-y-2">
                    {loadingRates && <div className="text-sm text-gray-500">Fetching live rates…</div>}
                    {!loadingRates && !rates && <div className="text-sm text-gray-500">Select a package to see available rates.</div>}
                    {rates && rates.length === 0 && <div className="text-sm text-gray-500">No rates returned for this address/package.</div>}
                    {rates && rates.map((r) => (
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
                        <Button size="sm" onClick={() => buyLabelShipEngine(r)} disabled={seBuyingRateId === r.rateObjectId}>
                          {seBuyingRateId === r.rateObjectId ? "Buying…" : "Buy Label"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Manual: entry */}
            {mode === "manual" && (
              <div className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Customer will receive an email with tracking.</div>
                  <Button size="sm" onClick={saveManualShipment} disabled={mSaving}>
                    {mSaving ? "Saving…" : "Save & Email Customer"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShipmentWizard;
