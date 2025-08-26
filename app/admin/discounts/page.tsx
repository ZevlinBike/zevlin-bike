// app/admin/discounts/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDiscounts } from "./actions";
import DiscountForm from "./components/DiscountForm";
import { Badge } from "@/components/ui/badge";

export default async function DiscountsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) || {};
  const autoOpen = sp.new === '1' || sp.new === 'true';
  const q = ((sp.q as string) || "").toLowerCase();
type AdminDiscount = {
  id: string;
  code: string | null;
  description: string | null;
  type: 'percentage' | 'fixed';
  value: number | string;
  usage_limit: number | null;
  uses: number;
  expiration_date: string | null;
  active: boolean;
  created_at: string;
};
  const discounts = (await getDiscounts()) as AdminDiscount[];
  const filtered: AdminDiscount[] = q
    ? discounts.filter((d: AdminDiscount) =>
        (d.code || '').toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q)
      )
    : discounts;

  return (
    <div className="space-y-6 text-black dark:text-white">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Discounts</h1>
        <div className="w-full sm:w-auto"><DiscountForm autoOpen={!!autoOpen} /></div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Discount Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((discount) => (
                <TableRow key={discount.id}>
                  <TableCell className="font-mono text-sm">{discount.code}</TableCell>
                  <TableCell>{discount.description}</TableCell>
                  <TableCell className="capitalize">{discount.type}</TableCell>
                  <TableCell>
                    {discount.type === 'percentage' ? `${discount.value}%` : `${Number(discount.value).toFixed(2)}`}
                  </TableCell>
                  <TableCell>
                    {discount.usage_limit ? `${discount.uses} / ${discount.usage_limit}` : discount.uses}
                  </TableCell>
                  <TableCell>
                    {discount.expiration_date ? new Date(discount.expiration_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={discount.active ? "default" : "destructive"}>
                      {discount.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(discount.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                  <TableCell className="text-right">
                    <DiscountForm discount={discount} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
