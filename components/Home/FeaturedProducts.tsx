import React from "react";
import ProductCard from "../Product/ProductCard";
import { products } from "@/utils/products";

const FeaturedProducts = () => {
  return (
    <section className="py-12">
      <div className="grid grid-cols-1 gap-8">
        {products.map((product) => (
          <ProductCard key={product.name} {...product} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedProducts;
