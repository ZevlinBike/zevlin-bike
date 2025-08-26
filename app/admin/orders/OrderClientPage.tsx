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
import { Order, Customer } from "@/lib/schema";
import { useDebouncedCallback } from "use-debounce";

type OrderWithCustomer = Order & {
  customers: Pick<Customer, "first_name" | "last_name" | "email"> | null;
  payment_status: string | null;
  order_status: string | null;
  shipping_status: string | null;
};

export default function OrderClientPage({
  orders,
}: {
  orders: OrderWithCustomer[];
}) {
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
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    replace(`${pathname}?${params.toString()}`);
  };

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
      <OrderTable orders={orders} />
    </div>
  );
}
