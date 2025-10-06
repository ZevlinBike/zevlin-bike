"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export type ProductLite = { id: string; name: string; price_cents: number };

export default function AdminInvoiceForm({ products, action }: { products: ProductLite[]; action: (data: FormData) => void }) {
  const [items, setItems] = useState<Record<string, number>>({});
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const suggested = useMemo(() => {
    return Object.entries(items).reduce((sum, [pid, qty]) => {
      const p = products.find(pr => pr.id === pid);
      return sum + (p ? p.price_cents * qty : 0);
    }, 0);
  }, [items, products]);
  const [finalTotal, setFinalTotal] = useState<number | "">("");

  const updateQty = (id: string, qty: number) => {
    setItems((prev) => {
      const next = { ...prev };
      if (qty <= 0 || Number.isNaN(qty)) delete next[id]; else next[id] = Math.floor(qty);
      return next;
    });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set("email", email);
    if (name) fd.set("name", name);
    if (note) fd.set("note", note);
    fd.set("items", JSON.stringify(Object.entries(items).map(([product_id, qty]) => ({ product_id, quantity: qty }))));
    const final = finalTotal === "" ? suggested : Math.round(Number(finalTotal) * 100);
    fd.set("final_total_cents", String(final));
    fd.set("suggested_total_cents", String(suggested));
    action(fd);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Invoice</CardTitle>
        <CardDescription>
          Select products and quantities, adjust total if needed, and generate a shareable payment link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium" htmlFor="inv-email">Customer Email</label>
              <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@example.com" required />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="inv-name">Customer Name (optional)</label>
              <Input id="inv-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="First Last" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Products</label>
            <div className="mt-2 max-h-64 overflow-auto rounded border divide-y">
              {products.map((p) => {
                const qty = items[p.id] || 0;
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-neutral-500">${(p.price_cents / 100).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-24"
                        min={0}
                        step={1}
                        value={qty}
                        onChange={(e) => updateQty(p.id, Number(e.target.value))}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 items-end">
            <div>
              <div className="text-sm font-medium">Suggested Total</div>
              <div className="text-lg font-semibold">${(suggested / 100).toFixed(2)}</div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="inv-final">Final Total (override)</label>
              <Input id="inv-final" type="number" step="0.01" min={0}
                value={finalTotal === "" ? "" : (Number(finalTotal).toString())}
                onChange={(e) => setFinalTotal(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={(suggested / 100).toFixed(2)}
              />
              <div className="text-xs text-neutral-500 mt-1">If left blank, suggested total will be used.</div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="inv-note">Note (optional)</label>
            <Input id="inv-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a short note for the customer" />
          </div>

          <Button type="submit" className="w-full">Create Invoice & Get Link</Button>
        </form>
      </CardContent>
    </Card>
  );
}
