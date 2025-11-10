"use client";

import { Product } from "@/lib/schema";
import { motion, useAnimation } from "framer-motion";
import { useCartStore } from "@/store/cartStore";
import { useState } from "react";

export default function AddToCartButton({ product, disabled }: { product: Product; disabled?: boolean }) {
  const addToCart = useCartStore((s) => s.addToCart);
  const [added, setAdded] = useState(false);
  const controls = useAnimation();

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    setAdded(true);
    addToCart(product);
    controls.start({ scale: [1, 1.1, 0.98, 1], backgroundColor: ["#2563eb", "#22c55e", "#2563eb"] });
    setTimeout(() => setAdded(false), 900);
  };

  return (
    <motion.button
      className={`text-white px-5 py-2 rounded font-semibold text-sm ${
        disabled
          ? "bg-neutral-400 dark:bg-neutral-600 cursor-not-allowed"
          : added
          ? "bg-green-500"
          : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
      }`}
      onClick={onClick}
      animate={controls}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      style={{ outline: "none", border: "none" }}
      disabled={!!disabled}
    >
      {added ? "Added!" : disabled ? "Out of Stock" : "Add to Cart"}
    </motion.button>
  );
}

