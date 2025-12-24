"use client";

import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import Link from "next/link";
import { useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { Product } from "@/lib/schema";
import ProductCardInfo from "./product/ProductCardInfo";

const ProductCard = ({ product }: { product: Product }) => {
  const addToCart = useCartStore((state) => state.addToCart);
  const [added, setAdded] = useState(false);
  const controls = useAnimation();

  const featuredImage = product.product_images?.find(img => img.is_featured)?.url || product.product_images?.[0]?.url || "/images/placeholder.webp";

  const isOutOfStock = !product.quantity_in_stock || product.quantity_in_stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    if (isOutOfStock) return;
    // Prevent the surrounding Link navigation when clicking the button
    e.preventDefault();
    e.stopPropagation();
    setAdded(true);
    addToCart(product);
    controls.start({ scale: [1, 1.2, 0.95, 1], backgroundColor: ["#2563eb", "#22c55e", "#2563eb"] });
    setTimeout(() => setAdded(false), 1000);
  };

  // Modal removed; product card now links to dedicated page

  return (
    <Link href={`/products/${product.slug}`} className="group relative block">
      <div className="relative flex flex-col h-full">
        {/* Soft background glows */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-6 -left-6 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
          <div className="absolute -bottom-6 -right-4 h-28 w-28 rounded-full bg-pink-500/10 blur-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
        </div>

        {/* Product image with subtle motion */}
        <div className="relative aspect-square bg-gradient-to-br from-neutral-200 to-neutral-800 rounded-t-2xl">
          <motion.div
            initial={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.03, rotate: -0.5 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="relative h-full w-full"
          >
            <Image
              alt={product.name}
              src={featuredImage}
              fill
              className="object-contain p-4"
              sizes="(min-width: 1024px) 300px, 45vw"
            />
          </motion.div>
        </div>
        <ProductCardInfo  
          name={product.name}
          quantity_in_stock={product.quantity_in_stock}
          price_cents={product.price_cents}
          description={product.description}
          added={added}
          isOutOfStock={isOutOfStock}
          handleAddToCart={handleAddToCart}
          controls={controls}
        />
      </div>
    </Link>
  );
};

export default ProductCard;
