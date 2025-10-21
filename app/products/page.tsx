import MainLayout from "@/app/components/layouts/MainLayout";
import AllProducts from "../components/AllProducts";
import Newsletter from "../components/Newsletter";
import { getProducts } from "../admin/products/actions";
import { createClient } from "@/lib/supabase/server";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = ((await searchParams) || {}) as Record<string, string | string[] | undefined>;
  const categorySlug = sp.category as string | undefined;
  const focusSlug = sp.focus as string | undefined;
  const products = await getProducts(categorySlug);

  console.log(focusSlug)

  // Load active categories for filters/footer coherence
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("product_categories")
    .select("name, slug, sort_order, active, show_in_footer")
    .eq("active", true)
    .order("sort_order");
  return (
    <MainLayout>
      <div className="pt-32 min-h-screen text-black bg-gray-100 dark:text-white dark:bg-neutral-900">
        <AllProducts
          products={products}
          activeCategorySlug={categorySlug}
          categories={(categories || []).map(c => ({ name: c.name, slug: c.slug }))}
          focusProduct={focusSlug}
        />
        <Newsletter />
      </div>
    </MainLayout>
  );
}
