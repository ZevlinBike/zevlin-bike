"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Order, Customer } from "@/lib/schema";
import { updateOrderStatus } from "../actions";
import { toast } from "sonner";
import { PrintModal } from "./PrintModal";

type OrderWithCustomer = Order & {
  customers: Pick<Customer, "first_name" | "last_name" | "email"> | null;
};

export default function OrderTable({ orders }: { orders: OrderWithCustomer[] }) {
  const handleStatusChange = async (orderId: string, status: string) => {
    const result = await updateOrderStatus(orderId, status);
    if (result.success) {
      toast.success("Order status updated successfully.");
    } else {
      toast.error(result.error || "Failed to update order status.");
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-sm">
                {order.id.substring(0, 8)}
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  {order.customers?.first_name} {order.customers?.last_name}
                </div>
                <div className="text-xs text-gray-500">
                  {order.customers?.email}
                </div>
              </TableCell>
              <TableCell>
                {new Date(order.created_at!).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Select
                  defaultValue={order.status}
                  onValueChange={(value) =>
                    handleStatusChange(order.id, value)
                  }
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="fulfilled">Fulfilled</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right font-medium">
                ${(order.total_cents / 100).toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <PrintModal orderId={order.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
