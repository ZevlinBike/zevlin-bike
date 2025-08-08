import MainLayout from "@/components/layouts/MainLayout";
import AllProducts from "../components/AllProducts";
import Newsletter from "../components/Newsletter";
import { getProducts } from "../admin/products/actions";

export default async function ProductsPage() {
  const products = await getProducts();
  return (
    <MainLayout>
      <div className="pt-32 min-h-screen text-black bg-gray-100 dark:text-white dark:bg-neutral-900">
        <AllProducts products={products} />
        <Newsletter />
      </div>
    </MainLayout>
  );
}
