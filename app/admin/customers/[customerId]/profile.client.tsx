"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Customer } from "@/lib/schema";
import { toast } from "sonner";
import Link from "next/link";

type OrderRow = {
  id: string;
  total_cents: number;
  created_at?: string | null;
  payment_status?: string | null;
  order_status?: string | null;
  shipping_status?: string | null;
};

export default function CustomerProfileClient({
  customer,
  orders,
}: {
  customer: Customer;
  orders: OrderRow[];
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const money = (c: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(c / 100);
  const formatStatus = (s: string | null) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

  async function sendEmail() {
    if (!subject.trim() || !message.trim()) {
      toast.error('Please provide a subject and message.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}/contact`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send email');
      toast.success('Email sent');
      setSubject('');
      setMessage('');
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{customer.first_name} {customer.last_name}</h1>
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          <span className="mr-3">{customer.email}</span>
          {customer.phone && <span>{customer.phone}</span>}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500">Joined {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : ''}</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-md border">
          <div className="p-3 border-b">
            <h2 className="font-semibold">Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Shipping</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-gray-500">No orders</TableCell>
                  </TableRow>
                )}
                {orders.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-900/40">
                    <TableCell className="font-mono text-xs">
                      <Link href={`/admin/order/${o.id}`}>#{o.id.substring(0,8)}</Link>
                    </TableCell>
                    <TableCell>{o.created_at ? new Date(o.created_at).toLocaleDateString() : ''}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{formatStatus(o.payment_status || null)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{formatStatus(o.order_status || null)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{formatStatus(o.shipping_status || null)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{money(o.total_cents)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-md border">
          <div className="p-3 border-b">
            <h2 className="font-semibold">Contact Customer</h2>
          </div>
          <div className="p-3 space-y-3">
            <input
              className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <textarea
              className="w-full min-h-[120px] rounded-md border border-gray-200 bg-white p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              placeholder={`Write a message to ${customer.first_name}…`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button onClick={sendEmail} disabled={sending || !subject.trim() || !message.trim()}>
              {sending ? 'Sending…' : 'Send Email'}
            </Button>
            <div className="text-xs text-gray-500">Sends to {customer.email}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
