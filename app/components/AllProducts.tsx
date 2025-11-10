import Link from "next/link";
import { Product } from "@/lib/schema";
import ProductCard from "./ProductCard";
import { Droplets, Sparkles, Grid2X2, Tag } from "lucide-react";

// --- AllProducts Component ---
export default function AllProducts({
  products,
  activeCategorySlug,
  categories,
}: {
  products: Product[];
  activeCategorySlug?: string;
  categories: { name: string; slug: string }[];
}) {
  const displayTitle = activeCategorySlug
    ? categories.find(c => c.slug === activeCategorySlug)?.name || "Products"
    : "All Products";
  const filterOptions = [{ name: "All", slug: "" }, ...categories];

  const Icon = ({ slug }: { slug: string }) => {
    const s = (slug || "").toLowerCase();
    if (!s) return <Grid2X2 className="w-4 h-4" />;
    if (s.includes("limited")) return <Sparkles className="w-4 h-4" />;
    if (s.includes("cream") || s.includes("chamois")) return <Droplets className="w-4 h-4" />;
    return <Tag className="w-4 h-4" />;
  };

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

        {/* Enhanced filter bar */}
        <div className="mb-12 flex justify-center">
          <div className="inline-flex items-center gap-1 p-1.5 rounded-full border border-gray-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/50 shadow-sm backdrop-blur-md">
            {filterOptions.map((cat) => {
              const isActive = ((cat.slug || "") === (activeCategorySlug || ""));
              const href = cat.slug ? `/products?category=${cat.slug}` : "/products";
              return (
                <Link
                  key={cat.slug || "all"}
                  href={href}
                  className={`group/btn relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition 
                    ${
                      isActive
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                >
                  <Icon slug={cat.slug} />
                  <span>{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard product={p} key={p.id} />
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
