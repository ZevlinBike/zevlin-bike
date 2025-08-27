import { getRefunds } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import RefundRowActions from "./RefundRowActions";

type StatusParam = 'pending' | 'approved' | 'rejected' | 'all';
const isStatusParam = (v: unknown): v is StatusParam => v === 'pending' || v === 'approved' || v === 'rejected' || v === 'all';

export default async function RefundsPage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  const resolved = searchParams ? await searchParams : undefined;
  const raw = resolved?.status;
  const status: StatusParam = isStatusParam(raw) ? raw : 'pending';
  const refunds = await getRefunds(status);

  // Server actions are invoked directly from the client component

  return (
    <div className="space-y-6 text-black dark:text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Refunds</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/admin/refunds?status=pending" className={`underline ${status==='pending' ? 'font-semibold' : ''}`}>Pending</Link>
          <Link href="/admin/refunds?status=approved" className={`underline ${status==='approved' ? 'font-semibold' : ''}`}>Approved</Link>
          <Link href="/admin/refunds?status=rejected" className={`underline ${status==='rejected' ? 'font-semibold' : ''}`}>Rejected</Link>
          <Link href="/admin/refunds?status=all" className={`underline ${status==='all' ? 'font-semibold' : ''}`}>All</Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Refund Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Refund</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(refunds || []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id.substring(0,8)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/admin/order/${r.order_id}`} className="underline">{r.order_id.substring(0,8)}</Link>
                  </TableCell>
                  <TableCell>
                    {r.customer?.first_name || 'Customer'} {r.customer?.last_name || ''}
                    <div className="text-xs text-gray-500">{r.customer?.email}</div>
                  </TableCell>
                  <TableCell>${(r.amount_cents/100).toFixed(2)}</TableCell>
                  <TableCell className="max-w-xs truncate" title={r.reason || ''}>{r.reason || '-'}</TableCell>
                  <TableCell className="capitalize">{r.status}</TableCell>
                  <TableCell className="text-right">
                    {r.status === 'pending' ? (
                      <RefundRowActions refundId={r.id} />
                    ) : (
                      <span className="text-sm text-gray-500">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {refunds.length === 0 && (
            <div className="text-sm text-gray-500 py-6">No refunds found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
