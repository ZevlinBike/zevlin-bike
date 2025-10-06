import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createInvoice } from "./actions";
import Link from "next/link";
import AdminInvoiceForm, { ProductLite } from "./AdminInvoiceForm";
import { createClient } from "@/lib/supabase/server";

export default async function AdminFunctionsPage({ searchParams }: { searchParams: Promise<{ [k: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const hasError = params?.error === "missing_required_fields" || params?.error === "invalid_amount" || params?.error === "stripe_not_configured" || params?.error === 'create_invoice_failed';
  const invoiceId = typeof params?.invoice === 'string' ? params.invoice : undefined;
  const cs = typeof params?.cs === 'string' ? params.cs : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Functions</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">One-off utilities for ops and support tasks.</p>
      </div>

      {hasError && (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-800 px-4 py-2 text-sm dark:border-red-900/50 dark:bg-red-950 dark:text-red-200">Action failed. Please try again.</div>
      )}

      {(invoiceId && cs) && (
        <Card>
          <CardHeader>
            <CardTitle>Share Payment Link</CardTitle>
            <CardDescription>Send this link to the customer to complete payment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm break-all">
              <Link href={`/pay/${invoiceId}?cs=${cs}`} className="text-blue-600 underline">/pay/{invoiceId}?cs=…</Link>
            </div>
            <div className="text-xs text-neutral-500">Once paid, the order will automatically move to pending fulfillment.</div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Invoice builder with itemization */}
        {await (async () => {
          const supabase = await createClient();
          const { data: products } = await supabase.from('products').select('id, name, price_cents').order('name', { ascending: true });
          return <AdminInvoiceForm products={(products || []) as ProductLite[]} action={createInvoice} />
        })()}
        {/* Future utilities can be added here as additional cards */}
      </div>
    </div>
  );
}
