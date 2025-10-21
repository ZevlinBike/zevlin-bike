import Link from "next/link";
import { Product } from "@/lib/schema";
import ProductCard from "./ProductCard";

// --- AllProducts Component ---
export default function AllProducts({
  products,
  activeCategorySlug,
  categories,
  focusProduct
}: {
  products: Product[];
  activeCategorySlug?: string;
  categories: { name: string; slug: string }[];
  focusProduct?: string;
}) {
  const displayTitle = activeCategorySlug
    ? categories.find(c => c.slug === activeCategorySlug)?.name || "Products"
    : "All Products";

    console.log({focusProduct})

  return (
    <section id="products" className="py-20">
      <div className="container px-4 mx-auto lg:px-6">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
            {displayTitle}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {products.length} {products.length === 1 ? "item" : "items"}
          </p>
        </div>

        <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
          {[{ name: "All", slug: "" }, ...categories].map((cat) => {
            const isActive = ((cat.slug || "") === (activeCategorySlug || ""));
            return (
              <Link
                key={cat.slug || "all"}
                href={cat.slug ? `/products?category=${cat.slug}` : "/products"}
                className={`px-3 py-1.5 rounded-full text-sm transition border
                  ${
                    isActive
                      ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                      : "bg-white/70 text-gray-800 border-gray-200 hover:border-gray-400 dark:bg-neutral-800/60 dark:text-gray-200 dark:border-neutral-700 dark:hover:border-neutral-500"
                  }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard isFocused={p.slug === focusProduct} product={p} key={p.id} />
          ))}
        </div>

        {products.length === 0 && (
          <div className="mt-12 text-center text-gray-600 dark:text-gray-300">
            No products found. Try a different filter.
          </div>
        )}
      </div>
    </section>
  );
}
