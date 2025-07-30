"use client";
import useAllProducts from "@/hooks/useAllProducts";
import ProductCard from "./ProductCard";

// --- AllProducts Component ---
export default function AllProducts() {
  const products = useAllProducts();
  return (
    <section id="products" className="py-20">
      <div className="container px-4 mx-auto lg:px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
            All Products
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {" "}
          {products.map((p, i) => (
            <ProductCard product={p} key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
