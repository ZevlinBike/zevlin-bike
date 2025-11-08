import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getDashboardStats, getToFulfillOrders } from "./actions";
import ActivityCard from "./components/ActivityCard";
import RecentOrdersCard from "./components/RecentOrdersCard";
import FinancialCard from "./components/FinancialCard";
import {
  Package, Truck, TrendingUp, Clock, AlertTriangle, Activity,
} from "lucide-react";

const getStatusClass = (status: string | null): string => {
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
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    default:
      return "";
  }
};

const formatStatus = (status: string | null) => {
  if (!status) return "";
  return status
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default async function AdminDashboard() {
  // const sp: SearchParams = (await (searchParams ?? Promise.resolve({}))) as SearchParams;

  const [stats, toFulfill] = await Promise.all([
    getDashboardStats(),
    getToFulfillOrders(),
  ]);

  // Operational KPIs (non-financial)
  const kpis = [
    { label: "Orders Today", value: String(stats.ordersToday), icon: Package },
    { label: "Unfulfilled", value: String(stats.unfulfilledCount), icon: Clock },
    { label: "Labels Today", value: String(stats.labelsTodayCount), icon: Truck },
    { label: "In Transit", value: String(stats.inTransitCount), icon: Activity },
    { label: "Exceptions", value: String(stats.exceptionsCount), icon: AlertTriangle },
    { label: "Pending Refunds", value: String(stats.pendingRefundsCount), icon: TrendingUp },
  ];

  // To-fulfill orders fetched server-side with is_training = false

  return (
    <div className="space-y-6 text-black dark:text-white">
      {/* Today's Focus: a simple, guided checklist */}
      <Card className="border-blue-200 dark:border-blue-900/40 bg-neutral-50 dark:bg-neutral-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Today’s Focus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(() => {
            const focusItems = [
              { label: "Orders to Fulfill", value: stats.unfulfilledCount, href: "/admin/fulfillment?dataset=real", cta: "Start" },
              { label: "Pending Payments", value: stats.pendingPaymentCount, href: "/admin/orders?order_status=pending_payment&dataset=real", cta: "Review" },
              { label: "Pending Refunds", value: stats.pendingRefundsCount, href: "/admin/refunds", cta: "Handle" },
              { label: "Shipping Issues", value: stats.exceptionsCount, href: "/admin/orders?shipping_status=lost&dataset=real", cta: "Resolve" },
            ];
            const actionable = focusItems.filter((i) => (Number(i.value) || 0) > 0);
            if (actionable.length === 0) {
              return (
                <div className="rounded-md border p-4 bg-white dark:bg-neutral-950 text-sm text-gray-700 dark:text-gray-300">
                  You’re all caught up. Nothing needs your attention right now.
                </div>
              );
            }
            return (
              <>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {actionable.map((item, idx) => (
                    <FocusRow
                      key={item.label}
                      n={idx + 1}
                      label={item.label}
                      value={item.value}
                      href={item.href}
                      cta={item.cta}
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">Work left to right. Each step opens the right screen and guides you through it.</p>
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* Dashboard title and action buttons removed for cleaner layout */}

      {/* FINANCIALS */}
      <div className="space-y-3 ">
        <div className="text-[11px] font-semibold uppercase tracking-wide bg-green-400 dark:bg-green-700 rounded-full p-0.5 px-2 text-gray-800 dark:text-gray-200">Financials</div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 ">
          <FinancialCard label="Today’s Revenue" value={stats.revenueToday} />
          <FinancialCard label="Month-to-Date Revenue" value={stats.revenueMonth} />
          <FinancialCard label="Year-to-Date Revenue" value={stats.revenueYear} />
        </div>
      </div>

      {/* OPERATIONS */}
      <div className="space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide bg-orange-300 dark:bg-orange-700 rounded-full p-0.5 px-2 text-gray-800 dark:text-gray-200">Operations</div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {kpis.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="shadow-sm hover:shadow transition-shadow border border-gray-200/80 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</CardTitle>
                <Icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Fulfillment queue */}
        <Card className="lg:col-span-3 w-full shadow-sm hover:shadow transition-shadow border border-gray-200/80 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-800">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>To Fulfill</CardTitle>
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <Link href="/admin/fulfillment?dataset=real">Start</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
                <Link href="/admin/fulfillment">View all</Link>
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
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toFulfill.map((o, idx) => (
                  <TableRow key={o.id} className={idx % 2 === 0 ? 'bg-white/40 dark:bg-neutral-900/30' : ''}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">#{o.id.substring(0,8)}</TableCell>
                    <TableCell className="whitespace-nowrap">{o.customers?.first_name ?? "Guest"} {o.customers?.last_name ?? ""}</TableCell>
                    <TableCell className="whitespace-nowrap">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="secondary" className={getStatusClass(o.shipping_status)}>{formatStatus(o.shipping_status)}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">${(o.total_cents/100).toFixed(2)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                        <Link href={`/admin/order/${o.id}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {toFulfill.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-gray-500">All caught up. Nothing to fulfill.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent activity */}
        <ActivityCard />
      </div>

      {/* Recent orders */}
      <RecentOrdersCard />
    </div>
  );
}

function FocusRow({ n, label, value, href, cta }: { n: number; label: string; value: number; href: string; cta: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3 bg-white dark:bg-neutral-950">
      <div className="flex items-center gap-3">
        <div className="size-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 flex items-center justify-center text-xs font-bold">{n}</div>
        <div className="text-sm">
          <div className="font-medium">{label}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{value} {value === 1 ? 'item' : 'items'}</div>
        </div>
      </div>
      <Button asChild size="sm"><Link href={href}>{cta}</Link></Button>
    </div>
  );
}
