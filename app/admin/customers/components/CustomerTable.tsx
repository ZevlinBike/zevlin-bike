"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Customer } from "@/lib/schema";

export default function CustomerTable({ customers, initialQuery = "" }: { customers: Customer[]; initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery);
  useEffect(() => setQ(initialQuery), [initialQuery]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return customers;
    return customers.filter(c =>
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(s) ||
      (c.email || "").toLowerCase().includes(s) ||
      (c.phone || "").toLowerCase().includes(s)
    );
  }, [q, customers]);
  return (
    <div className="rounded-md border">
      <div className="p-3">
        <input
          className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="Search customers…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.first_name} {customer.last_name}</TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>{customer.phone || 'N/A'}</TableCell>
              <TableCell>{new Date(customer.created_at!).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
