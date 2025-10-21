"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RotateCcw, Filter } from "lucide-react";

type OrderRow = {
  id: string;
  created_at: string;
  total_cents: number;
  is_training?: boolean | null;
  order_status?: string | null;
  customers?: { first_name?: string | null; last_name?: string | null } | null;
};

function formatStatus(s?: string | null) {
  if (!s) return '';
  return s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function statusClass(status?: string | null) {
  switch (status) {
    case "fulfilled":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "pending_fulfillment":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "cancelled":
    case "refunded":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-gray-300";
  }
}

export default function RecentOrdersCard() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTests, setShowTests] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/recent-orders', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load orders');
      setRows(Array.isArray(json.orders) ? json.orders : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const orders = useMemo(
    () => (showTests ? rows : rows.filter(r => !r.is_training)).slice(0, 10),
    [rows, showTests]
  );

  return (
    <Card className="col-span-1 lg:col-span-3 shadow-sm hover:shadow transition-shadow border border-gray-200/80 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-800">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Recent Orders</CardTitle>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setShowTests(v => !v)} className="h-7 px-2 text-xs" title={showTests ? 'Hide test orders' : 'Show test orders'}>
            <Filter className="h-3.5 w-3.5 mr-1" /> {showTests ? 'Tests: On' : 'Tests: Off'}
          </Button>
          <Button size="sm" variant="ghost" onClick={load} disabled={loading} className="h-7 px-2 text-xs" title="Refresh">
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
          <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
            <Link href={showTests ? '/admin/orders?dataset=all' : '/admin/orders?dataset=real'}>View all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o, idx) => (
              <TableRow key={o.id} className={idx % 2 === 0 ? 'bg-white/40 dark:bg-neutral-900/30' : ''}>
                <TableCell className="font-mono text-xs whitespace-nowrap">#{o.id.substring(0,8)}</TableCell>
                <TableCell className="whitespace-nowrap">{o.customers?.first_name || 'Guest'} {o.customers?.last_name || ''}</TableCell>
                <TableCell className="whitespace-nowrap">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant="secondary" className={statusClass(o.order_status)}>{formatStatus(o.order_status)}</Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">${(o.total_cents / 100).toFixed(2)}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    <Link href={`/admin/order/${o.id}`}>Open</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-gray-500">No recent orders.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
