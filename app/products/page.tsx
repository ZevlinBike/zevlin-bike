import PageShell from "@/app/components/layouts/PageShell";
import AllProducts from "../components/AllProducts";
import Newsletter from "../components/Newsletter";
import { getProducts } from "../admin/products/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = ((await searchParams) || {}) as Record<string, string | string[] | undefined>;
  const categorySlug = sp.category as string | undefined;
  const focusSlug = sp.focus as string | undefined;

  if (focusSlug) redirect(`/products/${focusSlug}`);

  const products = await getProducts(categorySlug);

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("product_categories")
    .select("name, slug, sort_order, active, show_in_footer")
    .eq("active", true)
    .order("sort_order");

  const mappedCategories = (categories || []).map((c) => ({ name: c.name, slug: c.slug }));

  return (
    <PageShell>
      <main className="bg-white dark:bg-neutral-950 min-h-screen text-neutral-900 dark:text-white selection:bg-emerald-100 selection:text-emerald-900">
        {/* HERO (matches About/Privacy/Mission styling) */}
        <section className="pt-32 pb-10 sm:pt-40 sm:pb-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Shop
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter leading-[1.1]">
            Zevlin <span className="text-emerald-600 dark:text-emerald-500">Products</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Performance care built for long miles—comfort, protection, and clean ingredients.
          </p>
        </section>

        {/* CINEMATIC SURFACE (no image dependency; consistent with Privacy slab) */}
        <section className="px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
          <div className="relative w-full max-w-[1600px] mx-auto rounded-3xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800">
            <div className="relative h-[28vh] sm:h-[32vh] bg-neutral-50 dark:bg-neutral-900">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.16),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.20),transparent_55%)]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/[0.04] via-transparent to-transparent dark:from-black/30" />

              <div className="absolute bottom-0 left-0 p-6 sm:p-10">
                <p className="text-sm font-semibold tracking-widest uppercase text-neutral-600 dark:text-neutral-300 mb-2">
                  Browse the lineup
                </p>
                <p className="text-2xl sm:text-3xl font-medium max-w-2xl leading-tight text-neutral-900 dark:text-white">
                  Find your go-to—daily comfort for road, gravel, and big adventures.
                </p>
              </div>

              <div className="absolute top-6 right-6 hidden sm:flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-2 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/50">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                  {mappedCategories.length} categories
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCTS SECTION */}
        <section className="px-4 sm:px-6 lg:px-8 pb-14 sm:pb-18">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-3xl border border-black/10 bg-white/80 backdrop-blur shadow-[0_18px_60px_-30px_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-neutral-950/60">
              <div className="p-4 sm:p-6">
                <AllProducts
                  products={products}
                  activeCategorySlug={categorySlug}
                  categories={mappedCategories}
                />
              </div>
            </div>
          </div>
        </section>

        <Newsletter />
      </main>
    </PageShell>
  );
}

