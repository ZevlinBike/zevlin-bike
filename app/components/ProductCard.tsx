"use client";

import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import Link from "next/link";
import { useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { Product } from "@/lib/schema";

const ProductCard = ({ product }: { product: Product }) => {
  const addToCart = useCartStore((state) => state.addToCart);
  const [added, setAdded] = useState(false);
  const controls = useAnimation();

  const featuredImage = product.product_images?.find(img => img.is_featured)?.url || product.product_images?.[0]?.url || "/images/placeholder.png";

  const isOutOfStock = !product.quantity_in_stock || product.quantity_in_stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    if (isOutOfStock) return;
    e.stopPropagation();
    setAdded(true);
    addToCart(product);
    controls.start({ scale: [1, 1.2, 0.95, 1], backgroundColor: ["#2563eb", "#22c55e", "#2563eb"] });
    setTimeout(() => setAdded(false), 1000);
  };

  // Modal removed; product card now links to dedicated page

  return (
    <Link href={`/products/${product.slug}`} className="group relative block">
      <div className="relative flex flex-col h-full p-3 sm:p-4">
        {/* Soft background glows */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-6 -left-6 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
          <div className="absolute -bottom-6 -right-4 h-28 w-28 rounded-full bg-pink-500/10 blur-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
        </div>

        {/* Product image with subtle motion */}
        <div className="relative aspect-square">
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

        {/* Text and CTA */}
        <div className="mt-2">
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">
            {product.name}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            {product.quantity_in_stock && product.quantity_in_stock > 0 ? (
              <Badge className="text-[10px] sm:text-xs dark:text-green-200 text-green-800 border bg-green-300/40 border-green-500/20 dark:bg-green-500/40 dark:border-green-500/30 w-fit">
                In Stock
              </Badge>
            ) : (
              <Badge className="text-[10px] sm:text-xs text-gray-500 border bg-neutral-500/10 border-gray-500/20 dark:bg-neutral-500/20 dark:border-gray-500/30 w-fit">
                Out of Stock
              </Badge>
            )}
            <span className="ml-auto text-lg font-bold text-blue-600 dark:text-blue-400">
              ${(product.price_cents / 100).toFixed(2)}
            </span>
          </div>

          {product.description && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="mt-3 flex justify-end">
            <motion.button
              className={`text-white px-3 py-1.5 rounded-full shadow-sm transition-colors duration-300 font-semibold focus:outline-none text-xs sm:text-sm ${
                added
                  ? "bg-green-500"
                  : isOutOfStock
                  ? "bg-neutral-400 dark:bg-neutral-600 cursor-not-allowed"
                  : "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600"
              }`}
              onClick={handleAddToCart}
              animate={controls}
              whileTap={{ scale: 0.95 }}
              style={{ outline: "none", border: "none" }}
              disabled={isOutOfStock}
            >
              {added ? "Added!" : isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </motion.button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
