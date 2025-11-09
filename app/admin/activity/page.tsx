import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SearchParams = Record<string, string | string[] | undefined>;

type ActivityItem = {
  ts: string;
  kind: "order" | "shipment" | "webhook";
  source?: "stripe" | "shippo" | string | null;
  title: string;
  subtitle?: string;
  href?: string;
};

type WebhookRow = {
  id: string;
  source: string | null;
  external_event_id: string;
  received_at: string;
  raw: Record<string, unknown> | null;
};

type ShipmentJoin = { order_id: string | null; tracking_number: string | null };
type ShipmentEventRow = {
  id: string;
  shipment_id: string;
  event_code: string | null;
  description: string | null;
  occurred_at: string;
  shipments: ShipmentJoin | ShipmentJoin[] | null;
};

type OrderRow = {
  id: string;
  created_at: string;
  total_cents: number;
  customers: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
};

export default async function ActivityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient();
  const sp = await searchParams;
  const qRaw = Array.isArray(sp.q) ? sp.q[0] : sp.q || "";
  const typeRaw = Array.isArray(sp.type) ? sp.type[0] : sp.type || "all";
  const q = String(qRaw).trim().toLowerCase();
  const type = String(typeRaw).toLowerCase();

  // Fetch recent items from the three key streams
  const [wh, sh, ord] = await Promise.all([
    supabase
      .from("webhook_events")
      .select("id, source, external_event_id, received_at, raw")
      .order("received_at", { ascending: false })
      .limit(100),
    supabase
      .from("shipment_events")
      .select("id, shipment_id, event_code, description, occurred_at, shipments(order_id, tracking_number)")
      .order("occurred_at", { ascending: false })
      .limit(100),
    supabase
      .from("orders")
      .select("id, created_at, total_cents, customers(first_name, last_name)")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const webhookItems: ActivityItem[] = ((wh.data as WebhookRow[] | null) || []).map((w) => {
    const src = (w.source || "").toLowerCase();
    let title = `Webhook: ${src}`;
    try {
      if (src === "stripe") {
        const t = (w.raw && (w.raw as { type?: string; event?: string; object?: { type?: string } }).type)
          || (w.raw && (w.raw as { event?: string }).event)
          || (w.raw && (w.raw as { object?: { type?: string } }).object?.type)
          || null;
        if (t) title = `Stripe: ${t}`;
      } else if (src === "shippo") {
        const ev = String(
          (w.raw && (w.raw as { event?: unknown }).event)
          || (w.raw && (w.raw as { type?: unknown }).type)
          || (w.raw && (w.raw as { status?: unknown }).status)
          || ""
        );
        if (ev) title = `Shippo: ${ev}`;
      }
    } catch {}
    return {
      ts: w.received_at,
      kind: "webhook",
      source: w.source,
      title,
      subtitle: `event_id=${w.external_event_id}`,
    };
  });

  const shipmentItems: ActivityItem[] = ((sh.data as ShipmentEventRow[] | null) || []).map((s) => {
    const shJoin = Array.isArray(s.shipments) ? s.shipments[0] : s.shipments;
    const track = shJoin?.tracking_number || "";
    const orderId = shJoin?.order_id || null;
    return {
      ts: s.occurred_at,
      kind: "shipment",
      source: "shippo",
      title: s.event_code ? `Shipment: ${s.event_code}` : "Shipment event",
      subtitle: [track && `Tracking ${track}`, orderId && `Order #${String(orderId).slice(0,8)}`]
        .filter(Boolean)
        .join(" · "),
      href: orderId ? `/admin/order/${orderId}` : undefined,
    };
  });

  const orderItems: ActivityItem[] = ((ord.data as OrderRow[] | null) || []).map((o) => {
    const cust = Array.isArray(o.customers) ? o.customers[0] : o.customers;
    const name = cust ? `${cust.first_name} ${cust.last_name}`.trim() : "Guest";
    return {
      ts: o.created_at,
      kind: "order",
      title: `New order from ${name}`,
      subtitle: `$${(o.total_cents / 100).toFixed(2)} · #${String(o.id).slice(0,8)}`,
      href: `/admin/order/${o.id}`,
    };
  });

  let items: ActivityItem[] = [...webhookItems, ...shipmentItems, ...orderItems];
  // Filter by type/source
  items = items.filter((it) => {
    if (type === "all") return true;
    if (type === "orders") return it.kind === "order";
    if (type === "shipments") return it.kind === "shipment";
    if (type === "webhooks") return it.kind === "webhook";
    if (type === "stripe") return it.kind === "webhook" && (it.source || "").toLowerCase() === "stripe";
    if (type === "shippo") return it.kind === "webhook" && (it.source || "").toLowerCase() === "shippo";
    return true;
  });
  // Text search
  if (q) {
    items = items.filter((it) =>
      [it.title, it.subtitle, it.source].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }
  // Sort desc by time
  items.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  // Limit display
  items = items.slice(0, 200);

  const filters: { label: string; value: string }[] = [
    { label: "All", value: "all" },
    { label: "Orders", value: "orders" },
    { label: "Shipments", value: "shipments" },
    { label: "Webhooks", value: "webhooks" },
    { label: "Stripe", value: "stripe" },
    { label: "Shippo", value: "shippo" },
  ];

  return (
    <div className="space-y-6 text-black dark:text-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Activity</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 sm:items-center">
          <form className="flex gap-2 w-full sm:w-auto" action="/admin/activity">
            <Input name="q" placeholder="Search events, IDs, tracking..." defaultValue={String(qRaw)} className="w-full sm:w-72" />
            <input type="hidden" name="type" value={type} />
            <Button type="submit" variant="outline">Search</Button>
          </form>
          <Button asChild variant="outline"><Link href="/admin">Dashboard</Link></Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => {
              const href = `/admin/activity?type=${f.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
              const active = type === f.value;
              return (
                <Link key={f.value} href={href}>
                  <Badge variant={active ? "default" : "secondary"}>{f.label}</Badge>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-200 dark:divide-neutral-800">
          {items.length === 0 ? (
            <div className="text-sm text-gray-500 py-6">No activity found.</div>
          ) : (
            items.map((it, idx) => (
              <div key={idx} className="py-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                <div className="w-full sm:w-40 shrink-0 font-mono text-xs text-gray-500">
                  {new Date(it.ts).toLocaleString()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    {it.kind === "order" && <Badge>Order</Badge>}
                    {it.kind === "shipment" && <Badge variant="outline">Shipment</Badge>}
                    {it.kind === "webhook" && (
                      <Badge variant="secondary">Webhook{it.source ? `:${String(it.source).toUpperCase()}` : ""}</Badge>
                    )}
                    <div className="font-medium truncate sm:whitespace-normal">
                      {it.title}
                    </div>
                  </div>
                  {it.subtitle && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-words sm:break-normal">
                      {it.subtitle}
                    </div>
                  )}
                </div>
                {it.href && (
                  <div className="shrink-0">
                    <Button asChild variant="outline" size="sm"><Link href={it.href}>View</Link></Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
