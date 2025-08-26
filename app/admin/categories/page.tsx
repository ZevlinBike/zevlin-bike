import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getCategories } from "./actions";
import CategoryForm from "./components/CategoryForm";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) || {};
  const q = ((sp.q as string) || "").toLowerCase();
  type CategoryRow = {
    id: string | number;
    name: string;
    slug: string;
    sort_order: number | null;
    active: boolean;
    show_in_footer: boolean;
  };
  const categories = (await getCategories()) as CategoryRow[];
  const filtered: CategoryRow[] = q
    ? categories.filter((c: CategoryRow) =>
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
      )
    : categories;
  return (
    <div className="space-y-6 text-black dark:text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <CategoryForm />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Product Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>In Footer</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c: CategoryRow) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="font-mono text-xs">{c.slug}</TableCell>
                  <TableCell>{c.sort_order}</TableCell>
                  <TableCell>
                    <Badge variant={c.active ? "default" : "destructive"}>{c.active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.show_in_footer ? "default" : "secondary"}>{c.show_in_footer ? "Shown" : "Hidden"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <CategoryForm category={c} />
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
