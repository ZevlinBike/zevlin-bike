import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getInvoiceShareLink } from "./actions";

type InvoiceRow = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  final_total_cents: number;
  created_at: string;
  stripe_payment_intent_id: string | null;
};

export default async function AdminInvoicesPage({ searchParams }: { searchParams: Promise<{ [k: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const invoiceId = typeof sp?.invoice === 'string' ? sp.invoice : undefined;
  const cs = typeof sp?.cs === 'string' ? sp.cs : undefined;
  const hasError = typeof sp?.error === 'string' ? sp.error : undefined;
  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, email, name, status, final_total_cents, created_at, stripe_payment_intent_id')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">List of admin-created invoices and their status.</p>
      </div>

      {(invoiceId && cs) && (
        <Card>
          <CardHeader>
            <CardTitle>Share Payment Link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm break-all">
              <Link href={`/pay/${invoiceId}?cs=${cs}`} className="text-blue-600 underline">/pay/{invoiceId}?cs=…</Link>
            </div>
          </CardContent>
        </Card>
      )}

      {hasError && (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-800 px-4 py-2 text-sm dark:border-red-900/50 dark:bg-red-950 dark:text-red-200">
          {hasError.replace(/_/g, ' ')}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoices || []).map((inv: InvoiceRow) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{inv.id.slice(0, 8)}…</TableCell>
                  <TableCell>
                    <div className="text-sm">{inv.name || inv.email}</div>
                    <div className="text-xs text-neutral-500">{inv.email}</div>
                  </TableCell>
                  <TableCell className="capitalize">{inv.status}</TableCell>
                  <TableCell>${(inv.final_total_cents / 100).toFixed(2)}</TableCell>
                  <TableCell>{new Date(inv.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <form action={getInvoiceShareLink}>
                      <input type="hidden" name="invoice_id" value={inv.id} />
                      <Button type="submit" size="sm" variant="outline">Get Link</Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(!invoices || invoices.length === 0) && (
            <div className="text-sm text-neutral-500">No invoices yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
