// app/admin/discounts/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDiscounts } from "./actions";
import DiscountForm from "./components/DiscountForm";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import ActiveToggle from "./components/ActiveToggle";
import DiscountRowActions from "./components/DiscountRowActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

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

  // Preload products for the wizard to reliably show images
  const supabase = await createClient();
  const { data: prodData } = await supabase
    .from('products')
    .select('id,name,slug,product_images(*)')
    .order('created_at', { ascending: true })
    .limit(500);
  type Row = { id: string; name: string; slug: string; product_images?: { url: string | null; is_featured?: boolean | null }[] | { url: string | null; is_featured?: boolean | null } | null };
  const allProducts = ((prodData || []) as Row[]).map((p) => {
    const imgs = Array.isArray(p.product_images) ? p.product_images : (p.product_images ? [p.product_images] : []);
    const featured = imgs.find((i) => !!i?.is_featured) || imgs[0];
    return { id: p.id, name: p.name, slug: p.slug, image_url: featured?.url || null };
  });
  const filtered: AdminDiscount[] = q
    ? discounts.filter((d: AdminDiscount) =>
        (d.code || '').toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q)
      )
    : discounts;

  return (
    <div className="space-y-6 text-black dark:text-white">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Discounts</h1>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <form action="/admin/discounts" className="flex gap-2 w-full sm:w-auto">
            <Input className="w-full sm:w-64" name="q" defaultValue={q} placeholder="Search code or description" />
            <Button type="submit" variant="secondary">Search</Button>
            {q && (
              <Button asChild variant="ghost">
                <Link href="/admin/discounts">Clear</Link>
              </Button>
            )}
          </form>
          <div className="ml-auto"><DiscountForm autoOpen={!!autoOpen} initialProducts={allProducts} /></div>
        </div>
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
                  <TableCell className="tabular-nums">
                    {discount.type === 'percentage' ? `${discount.value}%` : `$${Number(discount.value).toFixed(2)}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums">{discount.uses}{discount.usage_limit ? ` / ${discount.usage_limit}` : ''}</span>
                      {discount.usage_limit ? (
                        <div className="h-1.5 w-24 rounded bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, Math.round((discount.uses / Number(discount.usage_limit)) * 100))}%` }} />
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {discount.expiration_date ? new Date(discount.expiration_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={discount.active ? "default" : "destructive"}>
                        {discount.active ? "Active" : "Inactive"}
                      </Badge>
                      <ActiveToggle id={discount.id} initialActive={discount.active} />
                    </div>
                  </TableCell>
                  <TableCell>{new Date(discount.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                  <TableCell className="text-right">
                    <DiscountRowActions discount={discount} initialProducts={allProducts} />
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
