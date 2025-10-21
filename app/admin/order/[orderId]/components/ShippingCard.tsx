"use client";

import { useState } from "react";
import { OrderDetails } from "@/app/admin/orders/components/PackingSlip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CombinedPrintModal } from "@/app/admin/orders/components/CombinedPrintModal";
import { LabelPrintModal } from "@/app/admin/orders/components/LabelPrintModal";
import { toast } from "sonner";
import { Eraser, ExternalLink, Trash2, Truck } from "lucide-react";
import ShipmentWizard from "./ShipmentWizard";

type Shipment = {
  id: string;
  status: string;
  carrier: string | null;
  service: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  label_url: string | null;
  label_object_id?: string | null;
  created_at?: string | null;
};

// Display helpers
function titleCase(s: string) {
  return s
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function guessCarrierFromService(service?: string | null) {
  const sv = (service || "").toLowerCase();
  if (sv.startsWith("usps_")) return "USPS";
  if (sv.startsWith("ups_")) return "UPS";
  if (sv.startsWith("fedex_")) return "FedEx";
  if (sv.startsWith("dhl_")) return "DHL";
  if (sv.startsWith("ontrac_")) return "OnTrac";
  if (sv.startsWith("amazon_")) return "Amazon";
  return null;
}

function prettyCarrier(carrier?: string | null, service?: string | null) {
  const c = (carrier || "").trim();
  // Hide ShipEngine internal ids like se-3818755; infer from service when possible
  if (!c || /^se-\d+$/i.test(c)) {
    return guessCarrierFromService(service) || (c ? c.toUpperCase() : "");
  }
  // If it already looks like a brand code, normalize casing
  if (["usps", "ups", "fedex", "dhl"].includes(c.toLowerCase())) {
    const m: Record<string, string> = { usps: "USPS", ups: "UPS", fedex: "FedEx", dhl: "DHL" };
    return m[c.toLowerCase()] || c.toUpperCase();
  }
  return titleCase(c);
}

function prettyService(service?: string | null) {
  if (!service) return "";
  const s = service.toLowerCase();
  const map: Record<string, string> = {
    usps_first_class_mail: "First Class Mail",
    usps_priority_mail: "Priority Mail",
    usps_media_mail: "Media Mail",
    ups_ground: "Ground",
    ups_2nd_day_air: "2nd Day Air",
    fedex_ground: "Ground",
    fedex_2_day: "2 Day",
  };
  if (map[s]) return map[s];
  // fallback: humanize token
  return titleCase(s);
}

export default function ShippingCard({
  order,
  shipments,
  loadShipments,
  loadOrder,
  shipEngineEnabled,
}: {
  order: OrderDetails;
  shipments: Shipment[];
  loadShipments: () => Promise<void>;
  loadOrder: () => Promise<void>;
  shipEngineEnabled?: boolean;
}) {
  // no manual form state; handled in ShipmentWizard

  // Action state
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingId, setClearingId] = useState<string | null>(null);

  // Shipment wizard visibility
  const [wizardOpen, setWizardOpen] = useState(false);
  // removed resolve-id UI; robustness handled server-side on purchase

  // Auto-resolve missing label_url for the most recent purchased shipment
  // client no longer auto-resolves; server ensures label_url at purchase time

  // Compute latest purchased label (shipments are returned sorted by created_at desc)
  const latestLabeled = shipments.find((s) => !!s.label_url) || null;

  // manual shipment creation now occurs in ShipmentWizard

  // Print modal visibility (so the dropdown can close)
  const [labelPrintOpen, setLabelPrintOpen] = useState(false);
  const [combinedPrintOpen, setCombinedPrintOpen] = useState(false);

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

  return (
    <>
      {/* Print modals mounted outside the dropdown for reliable open/close */}
      {latestLabeled?.label_url ? (
        <>
          <LabelPrintModal
            labelUrl={latestLabeled.label_url}
            open={labelPrintOpen}
            onOpenChange={setLabelPrintOpen}
          />
          <CombinedPrintModal
            orderId={order.id}
            labelUrl={latestLabeled.label_url}
            open={combinedPrintOpen}
            onOpenChange={setCombinedPrintOpen}
          />
        </>
      ) : null}
      {/* Shipment Wizard */}
      <ShipmentWizard
        order={order}
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={async () => { await loadShipments(); await loadOrder(); }}
        shipEngineEnabled={!!shipEngineEnabled}
      />

      {/* Shipping Card */}
      <Card className="border-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm bg-white/90 dark:bg-neutral-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/70 min-w-0">
        <CardHeader className="pb-3 bg-gradient-to-b from-white/60 to-transparent dark:from-neutral-900/50 dark:to-transparent">
          <CardTitle>Shipping</CardTitle>
          <CardDescription>Rates, labels, and tracking.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 overflow-x-hidden">
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
            <div className="flex items-center gap-2">
              {latestLabeled && (
                <a
                  href={latestLabeled.label_url || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline"
                >
                  View Latest Label
                </a>
              )}
              <Button size="sm" onClick={() => setWizardOpen(true)} className="gap-2">
                Create Shipment
              </Button>
            </div>
          </div>

          {/* Latest Label summary */}
          {latestLabeled && (
            <div className="rounded-md border p-3 sm:p-4 bg-white/70 dark:bg-neutral-950/60">
              <div className="flex items-center justify-between gap-3 min-w-0">
                <div className="text-sm min-w-0">
                  <div className="font-medium mb-0.5">Latest Label</div>
                  <div className="text-gray-600 dark:text-gray-400 flex items-center gap-2 min-w-0">
                    <span className="whitespace-nowrap">{prettyCarrier(latestLabeled.carrier, latestLabeled.service)}</span>
                    {latestLabeled.service ? <span className="whitespace-nowrap">· {prettyService(latestLabeled.service)}</span> : null}
                    {latestLabeled.tracking_number ? (
                      <>
                        <span>·</span>
                        <a className="underline inline-flex items-center gap-1 min-w-0 truncate" href={latestLabeled.tracking_url ?? undefined} target="_blank" rel="noreferrer" title={latestLabeled.tracking_number || undefined}>
                          <span className="truncate max-w-[200px] sm:max-w-[280px]">{latestLabeled.tracking_number}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">Actions</Button>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <a href={latestLabeled.label_url || undefined} target="_blank" rel="noreferrer">Open Label</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLabelPrintOpen(true)}>
                      Print Label
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCombinedPrintOpen(true)}>
                      Print Label + Packing Slip
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          )}

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
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="text-sm min-w-0">
                    <div className="font-medium flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize shrink-0">{s.status}</Badge>
                      <span className="whitespace-nowrap shrink-0">
                        {prettyCarrier(s.carrier, s.service)} {s.service ? `· ${prettyService(s.service)}` : ""}
                      </span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 mt-0.5 flex items-center gap-2 min-w-0">
                      {s.tracking_number ? (
                        <a className="underline inline-flex items-center gap-1 min-w-0 truncate" href={s.tracking_url ?? undefined} target="_blank" rel="noreferrer" title={s.tracking_number || undefined}>
                          <span className="truncate max-w-[220px] sm:max-w-[280px]">{s.tracking_number}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                      ) : (
                        <span>No tracking</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">Actions</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {s.label_url && (
                          <>
                            <DropdownMenuItem asChild>
                              <a href={s.label_url} target="_blank" rel="noreferrer">Open Label</a>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <LabelPrintModal labelUrl={s.label_url} trigger={<span>Print Label</span>} />
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <CombinedPrintModal orderId={order.id} labelUrl={s.label_url} trigger={<span>Print Label + Packing Slip</span>} />
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => clearTracking(s.id)} disabled={clearingId === s.id}>
                          <Eraser className="h-4 w-4" />
                          {clearingId === s.id ? 'Clearing…' : 'Remove tracking only'}
                        </DropdownMenuItem>
                        {s.status === 'purchased' && (
                          <DropdownMenuItem onClick={() => voidLabelById(s.id)} disabled={voidingId === s.id}>
                            {voidingId === s.id ? 'Voiding…' : 'Void Label'}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => deleteShipment(s.id)} disabled={deletingId === s.id}>
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
    </>
  );
}
