import { Product } from "@/lib/schema";
import ProductCard from "./ProductCard";

// --- AllProducts Component ---
export default function AllProducts({ products }: { products: Product[] }) {
  return (
    <section id="products" className="py-20">
      <div className="container px-4 mx-auto lg:px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
            All Products
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard product={p} key={p.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
