"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import { toast } from "sonner";

type ShippingDetails = {
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
  } | null;
}

type OrderRow = {
  id: string;
  status: string;
  created_at: string;
  total_cents: number;
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

export default function FulfillmentClientPage({ orders }: { orders: OrderRow[] }) {
  const [query, setQuery] = useState("");
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [rates, setRates] = useState<RateOption[] | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);

  const list = useMemo(() => {
    const unfulfilled = orders || [];
    const q = query.trim().toLowerCase();
    if (!q) return unfulfilled;
    return unfulfilled.filter((o) => {
      const name = `${o.customers?.first_name ?? ''} ${o.customers?.last_name ?? ''}`.toLowerCase();
      const email = (o.customers?.email ?? '').toLowerCase();
      return o.id.includes(q) || name.includes(q) || email.includes(q);
    });
  }, [orders, query]);

  const money = (c: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(c / 100);

  async function fetchRates(orderId: string) {
    setOpenOrderId(orderId);
    setLoadingRates(true);
    setRates(null);
    try {
      const res = await fetch(`/api/shipping/rates`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load rates");
      setRates(json.rates || []);
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to load rates");
    } finally {
      setLoadingRates(false);
    }
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fulfillment Queue</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Search orders or customers" value={query} onChange={(e) => setQuery(e.target.value)} className="w-72" />
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
                <TableHead>Ship To</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((o) => {
                const cust = o.customers;
                const sd = o.shipping_details?.[0];
                const itemsCount = (o.line_items || []).length;
                const purchasedShipment = o.shipments?.find(s => s.status === 'purchased');
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">#{o.id.substring(0, 8)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{cust?.first_name ?? 'Guest'} {cust?.last_name ?? ''}</div>
                      <div className="text-xs text-gray-500">{cust?.email}</div>
                    </TableCell>
                    <TableCell className="tabular-nums">{itemsCount}</TableCell>
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
                          <Button size="sm" onClick={() => fetchRates(o.id)} disabled={loadingRates && openOrderId === o.id}>
                            {loadingRates && openOrderId === o.id ? 'Getting rates…' : 'Get Rates'}
                          </Button>
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
            <DialogTitle>Rates {openOrderId ? `for #${openOrderId.substring(0,8)}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {!rates && <div className="text-sm text-gray-500">{loadingRates ? 'Fetching live rates…' : 'No rates yet.'}</div>}
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
