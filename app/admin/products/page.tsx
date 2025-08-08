import { getProducts } from "./actions";
import ProductTable from "./components/ProductTable";

export default async function ProductsPage() {
  const products = await getProducts();

  console.log({products})

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Products</h1>
      <ProductTable products={products} />
    </div>
  );
}
