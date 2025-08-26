import { getProducts } from "./actions";
import ProductTable from "./components/ProductTable";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) || {};
  const q = (sp.q as string) || "";
  const openNew = sp.new === '1' || sp.new === 'true';
  const products = await getProducts();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Products</h1>
      <ProductTable products={products} initialQuery={q} openNewOnLoad={!!openNew} />
    </div>
  );
}
