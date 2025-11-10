"use client";

import { Product, ProductImage, ProductVariant } from "@/lib/schema";
import Image from "next/image";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import AddToCartButton from "./AddToCartButton";

export default function EpicHero({
  product,
  images,
  variants,
}: {
  product: Product;
  images: ProductImage[];
  variants: ProductVariant[];
}) {
  const featured = useMemo(
    () => images.find((i) => i.is_featured)?.url || images[0]?.url || "/images/placeholder.png",
    [images]
  );
  const [current, setCurrent] = useState<string>(featured);

  const isOutOfStock = !product.quantity_in_stock || product.quantity_in_stock <= 0;

  return (
    <section className="relative overflow-hidden">
      {/* Background glow / shapes */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/10 blur-3xl"
          animate={{ x: [0, 20, -10, 0], y: [0, -10, 10, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-15%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-pink-500/10 blur-3xl"
          animate={{ x: [0, -10, 15, 0], y: [0, 10, -10, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        {/* Product visual */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative w-full aspect-square"
          >
            {/* Soft radial behind product */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/20 via-white/0 to-pink-400/20 blur-2xl" />
            <Image
              src={current}
              alt={product.name}
              fill
              priority
              className="object-contain p-4 md:p-8"
            />
          </motion.div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {images.slice(0, 8).map((img) => {
                const isActive = img.url === current;
                return (
                  <button
                    key={img.id}
                    onClick={() => setCurrent(img.url)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden ring-1 transition ${
                      isActive ? "ring-blue-500" : "ring-transparent hover:ring-gray-300 dark:hover:ring-neutral-700"
                    }`}
                    aria-label="View product image"
                  >
                    <Image src={img.url} alt={img.alt_text || product.name} fill className="object-contain p-1 bg-white/0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
            className="text-3xl md:text-5xl font-extrabold tracking-tight font-product-display"
          >
            {product.name}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.12 }}
            className="mt-3 flex flex-wrap items-center gap-3"
          >
            {product.quantity_in_stock && product.quantity_in_stock > 0 ? (
              <span className="px-2 py-0.5 text-xs rounded bg-green-200/60 text-green-800 border border-green-500/30">In Stock</span>
            ) : (
              <span className="px-2 py-0.5 text-xs rounded bg-neutral-200/60 text-neutral-700 border border-neutral-500/30">Out of Stock</span>
            )}
            <span className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">${(product.price_cents / 100).toFixed(2)}</span>
          </motion.div>

          {product.description && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.18 }}
              className="mt-4 text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line"
            >
              {product.description}
            </motion.p>
          )}

          {variants.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.25 }}
              className="mt-6"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Available Options</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {variants.map((v) => (
                  <li key={v.id} className="flex justify-between items-center px-3 py-2 rounded bg-white/40 dark:bg-neutral-900/40 ring-1 ring-gray-200/60 dark:ring-neutral-800/60">
                    <span>{v.name}</span>
                    <span className="font-medium">{v.price_cents ? `$${(v.price_cents / 100).toFixed(2)}` : "—"}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
            className="mt-6 flex flex-wrap items-center gap-3"
          >
            <AddToCartButton product={product} disabled={isOutOfStock} />
            <a href="#details" className="text-sm text-blue-700 dark:text-blue-400 underline underline-offset-4">Learn more</a>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.35 }}
            className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300"
          >
            <li>• Free shipping on orders over $50</li>
            <li>• 30-day satisfaction guarantee</li>
            <li>• Made for cyclists, tested on long rides</li>
            <li>• Durable, premium-grade ingredients/materials</li>
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
