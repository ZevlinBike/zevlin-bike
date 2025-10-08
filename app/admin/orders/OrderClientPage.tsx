"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import OrderTable from "./components/OrderTable";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Order, Customer } from "@/lib/schema";
import { useDebouncedCallback } from "use-debounce";

type OrderWithCustomer = Order & {
  customers: Pick<Customer, "first_name" | "last_name" | "email"> | null;
  // Guest display fallbacks
  billing_name?: string | null;
  shipping_details?: { name?: string | null }[];
  is_training?: boolean | null;
  payment_status: string | null;
  order_status: string | null;
  shipping_status: string | null;
};

export default function OrderClientPage({
  orders,
}: {
  orders: OrderWithCustomer[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (key === 'dataset') {
      // Always persist dataset, including 'all'
      params.set('dataset', value || 'all');
    } else {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    replace(`${pathname}?${params.toString()}`);
  };

  const anySelected = selected.length > 0;
  async function bulk(action: string, value?: string | boolean) {
    if (!selected.length) return;
    const res = await fetch('/api/admin/orders/bulk', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids: selected, action, value }),
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || 'Bulk action failed');
    setSelected([]);
    replace(`${pathname}?${searchParams.toString()}`);
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center mb-4">
        <Input
          placeholder="Search by name, email, or order ID..."
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={searchParams.get("query")?.toString()}
          className="w-full sm:flex-1"
        />
        <Select
          onValueChange={(value) => handleFilterChange("dataset", value)}
          defaultValue={(searchParams.get("dataset") as string) || "real"}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Dataset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="real">Real Orders</SelectItem>
            <SelectItem value="training">Test Orders</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => handleFilterChange("payment_status", value)}
          defaultValue={searchParams.get("payment_status") || "all"}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="partially_refunded">Partially Refunded</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => handleFilterChange("order_status", value)}
          defaultValue={searchParams.get("order_status") || "all"}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Order Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Order Statuses</SelectItem>
            <SelectItem value="pending_payment">Pending Payment</SelectItem>
            <SelectItem value="pending_fulfillment">Pending Fulfillment</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => handleFilterChange("shipping_status", value)}
          defaultValue={searchParams.get("shipping_status") || "all"}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Shipping Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Shipping Statuses</SelectItem>
            <SelectItem value="not_shipped">Not Shipped</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {anySelected && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded border bg-gray-50 dark:bg-neutral-900/40 p-2 text-sm">
          <div className="font-medium">{selected.length} selected</div>
          <Button size="sm" variant="outline" onClick={() => bulk('set_training', true)}>Mark as Test</Button>
          <Button size="sm" variant="outline" onClick={() => bulk('set_training', false)}>Mark as Real</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">Set Order Status</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => bulk('set_order_status', 'pending_payment')}>Pending Payment</DropdownMenuItem>
              <DropdownMenuItem onClick={() => bulk('set_order_status', 'pending_fulfillment')}>Pending Fulfillment</DropdownMenuItem>
              <DropdownMenuItem onClick={() => bulk('set_order_status', 'fulfilled')}>Fulfilled</DropdownMenuItem>
              <DropdownMenuItem onClick={() => bulk('set_order_status', 'cancelled')}>Cancelled</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">Set Shipping</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => bulk('set_shipping_status', 'not_shipped')}>Not Shipped</DropdownMenuItem>
              <DropdownMenuItem onClick={() => bulk('set_shipping_status', 'shipped')}>Shipped</DropdownMenuItem>
              <DropdownMenuItem onClick={() => bulk('set_shipping_status', 'delivered')}>Delivered</DropdownMenuItem>
              <DropdownMenuItem onClick={() => bulk('set_shipping_status', 'returned')}>Returned</DropdownMenuItem>
              <DropdownMenuItem onClick={() => bulk('set_shipping_status', 'lost')}>Lost</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">Set Payment</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => bulk('set_payment_status', 'pending')}>Pending</DropdownMenuItem>
              <DropdownMenuItem onClick={() => bulk('set_payment_status', 'paid')}>Paid</DropdownMenuItem>
              <DropdownMenuItem onClick={() => bulk('set_payment_status', 'partially_refunded')}>Partially Refunded</DropdownMenuItem>
              <DropdownMenuItem onClick={() => bulk('set_payment_status', 'refunded')}>Refunded</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <OrderTable
        orders={orders}
        selected={selected}
        onToggle={(id) => setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
        onToggleAll={(ids) => {
          const sel = new Set(selected);
          const allSelected = ids.every(id => sel.has(id));
          if (allSelected) {
            setSelected(selected.filter(id => !ids.includes(id)));
          } else {
            const merged = new Set([...selected, ...ids]);
            setSelected(Array.from(merged));
          }
        }}
      />
    </div>
  );
}
