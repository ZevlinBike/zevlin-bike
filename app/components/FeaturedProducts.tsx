import useFeaturedProducts from "@/hooks/useFeaturedProducts";
import ProductCard from "./ProductCard";

// --- FeaturedProducts Component ---
export default function FeaturedProducts() {
  const products = useFeaturedProducts();
  return (
    <section
      id="products"
      className="py-20 bg-gradient-to-b from-white to-gray-100 dark:from-black dark:to-neutral-900"
    >
      <div className="container px-4 mx-auto lg:px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
            Ride Essentials, Perfected
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {" "}
          {/* Added sm:grid-cols-2 for better tablet layout */}
          {products.map((p, i) => (
            <ProductCard product={p} key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

