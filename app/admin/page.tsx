import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getRecentOrders } from "./actions";
import {
  DollarSign, Package, Truck, TrendingUp, Clock, AlertTriangle, Activity, Plus,
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
  const recentOrders = await getRecentOrders();

  // Placeholder metrics for the visual design — wire real data later
  const kpis = [
    { label: "Revenue Today", value: "$4,320", icon: DollarSign },
    { label: "Orders Today", value: "38", icon: Package },
    { label: "Avg. Order Value", value: "$56.84", icon: TrendingUp },
    { label: "Unfulfilled", value: "12", icon: Clock },
    { label: "Labels Today", value: "27", icon: Truck },
    { label: "In Transit", value: "81", icon: Activity },
  ];

  const toFulfill = recentOrders.filter(o => o.order_status === 'pending_fulfillment').slice(0, 6);
  const lowStock = [
    { sku: "ZEV-CRACK-4oz", name: "Crack Chamois (4oz)", qty: 8 },
    { sku: "ZEV-SCRK-8oz", name: "Super Crack (8oz)", qty: 3 },
    { sku: "ZEV-BYOT", name: "BYOT Fitness Wash", qty: 12 },
  ];
  const activity = [
    { ts: "10:21a", text: "Label purchased for #24af9c12 (USPS Priority)" },
    { ts: "10:05a", text: "Tracking update: #1Z839… in transit (UPS)" },
    { ts: "9:58a", text: "New order from Jane Doe ($74.99)" },
    { ts: "9:42a", text: "Low stock alert: Super Crack (8oz)" },
  ];

  return (
    <div className="space-y-6 text-black dark:text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm"><Link href="/admin/settings">Settings</Link></Button>
          <Button asChild size="sm"><Link href="/admin/orders"><Plus className="h-4 w-4 mr-1" /> New Order</Link></Button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</CardTitle>
              <Icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tabular-nums">{value}</div>
              <div className="mt-2 h-2 rounded bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                <div className="h-full w-2/3 bg-blue-500/30" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Fulfillment queue */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>To Fulfill</CardTitle>
            <Button asChild variant="outline" size="sm"><Link href="/admin/fulfillment">View all</Link></Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Shipping</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toFulfill.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">#{o.id.substring(0,8)}</TableCell>
                    <TableCell>{o.customers?.first_name ?? "Guest"} {o.customers?.last_name ?? ""}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusClass(o.payment_status)}>{formatStatus(o.payment_status)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusClass(o.shipping_status)}>{formatStatus(o.shipping_status)}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">${(o.total_cents/100).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Shipping snapshot */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><Truck className="h-4 w-4" /> Labels Purchased</div>
              <div className="font-semibold">27</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> In Transit</div>
              <div className="font-semibold">81</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-amber-600"><AlertTriangle className="h-4 w-4" /> Exceptions</div>
              <div className="font-semibold">3</div>
            </div>
            <div className="pt-2 flex gap-2">
              <Button asChild size="sm" className="flex-1"><Link href="/admin/fulfillment">Fulfill Orders</Link></Button>
              <Button asChild variant="outline" size="sm" className="flex-1"><Link href="/admin/settings/packages">Packages</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Inventory alerts */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Inventory Alerts</CardTitle>
            <Button asChild variant="outline" size="sm"><Link href="/admin/products">Manage</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStock.map((i) => (
              <div key={i.sku} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{i.name}</div>
                  <div className="text-gray-500 text-xs">SKU {i.sku}</div>
                </div>
                <Badge variant={i.qty < 5 ? 'destructive' : 'secondary'}>{i.qty} left</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Activity</CardTitle>
            <Button asChild variant="outline" size="sm"><Link href="/admin/orders">See all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.map((a, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm">
                <div className="font-mono text-xs text-gray-500 mt-0.5 w-14">{a.ts}</div>
                <div>{a.text}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders (keep) */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Button asChild variant="outline" size="sm"><Link href="/admin/orders">View all</Link></Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Shipping</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-medium">
                      {order.customers?.first_name || "Guest"}{" "}
                      {order.customers?.last_name || ""}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusClass(order.payment_status)}>{formatStatus(order.payment_status)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusClass(order.order_status)}>{formatStatus(order.order_status)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusClass(order.shipping_status)}>{formatStatus(order.shipping_status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">${(order.total_cents / 100).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
