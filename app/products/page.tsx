import MainLayout from "@/components/layouts/MainLayout";
import AllProducts from "../components/AllProducts";
import Newsletter from "../components/Newsletter";

export default function ProductsPage() {
  return (
    <MainLayout>
      <div className="pt-32 min-h-screen text-black bg-gray-100 dark:text-white dark:bg-neutral-900">
        <AllProducts />
        <Newsletter />
      </div>
    </MainLayout>
  );
}
