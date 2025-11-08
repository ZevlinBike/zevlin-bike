"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Filter } from "lucide-react";

type ActivityTagKind = 'payment' | 'order' | 'shipping' | 'test' | 'customer';
type ActivityTag = { kind: ActivityTagKind; value: string };
type Activity = { ts: string; text: string; tags?: ActivityTag[] };

function formatStatusLabel(s?: string | null) {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function statusClass(status?: string | null) {
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
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-gray-300";
  }
}

export default function ActivityCard() {
  const [data, setData] = useState<Activity[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTests, setShowTests] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/activity', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load activity');
      setData(Array.isArray(json.activity) ? json.activity : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const filtered = useMemo(() => {
    const activity = data ?? [];
    return showTests ? activity : activity.filter(a => !(a.tags || []).some(t => t.kind === 'test'));
  }, [data, showTests]);

  return (
    <Card className="col-span-1 lg:col-span-3 w-full shadow-sm hover:shadow transition-shadow border border-gray-200/80 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-800">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Activity</CardTitle>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowTests(v => !v)}
            className="h-7 px-2 text-xs"
            title={showTests ? 'Hide test items' : 'Show test items'}
          >
            <Filter className="h-3.5 w-3.5 mr-1" /> {showTests ? 'Tests: On' : 'Tests: Off'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={load}
            disabled={loading}
            className="h-7 px-2 text-xs"
            title="Refresh"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
          <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
            <Link href="/admin/activity">See all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 overflow-x-auto">
        <div className="relative min-w-full">
          <div className="pointer-events-none absolute top-1 bottom-1 border-l border-gray-200 dark:border-neutral-700" style={{ left: 'calc(7rem + 0.75rem)' }} />
          {filtered.slice(0, 10).map((a, idx) => (
            <div key={idx} className={`relative grid items-center gap-x-3 text-sm group whitespace-nowrap border-b border-gray-200/70 dark:border-neutral-800/70 ${idx % 2 === 0 ? 'bg-white/40 dark:bg-neutral-900/30' : ''}`} style={{ gridTemplateColumns: '7rem 1.5rem 1fr' }}>
              <div className="text-right font-mono text-xs text-gray-500 whitespace-nowrap">{a.ts}</div>
              <div className="flex items-center justify-center"><span className="h-2 w-2 rounded-full bg-gray-300 ring-2 ring-white dark:bg-neutral-600 dark:ring-neutral-800" /></div>
              <div className="flex items-center gap-2">
                <div className="leading-relaxed">{a.text}</div>
                {Array.isArray(a.tags) && a.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                    {a.tags.map((t, i) => {
                      if (t.kind === 'test') {
                        return (<Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 whitespace-nowrap">Test</Badge>);
                      }
                      if (t.kind === 'customer') {
                        return (<Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap">New Customer</Badge>);
                      }
                      return (<Badge key={i} variant="secondary" className={`${statusClass(t.value)} text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap`}>{formatStatusLabel(t.value)}</Badge>);
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {(!loading && filtered.length === 0) && (
          <div className="text-sm text-gray-500">No recent activity.</div>
        )}
      </CardContent>
    </Card>
  );
}
