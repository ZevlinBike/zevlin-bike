
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HeroProduct from "./HeroProduct";
import { Product } from "@/lib/schema";
// removed unused imports

export default function HeroProductGrid({
  products,
}: {
  products: (Product & { featured_image: string })[];
}) {
  const heroProducts = products.slice(0, 2);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const current = heroProducts[index];

  // Auto-rotate
  useEffect(() => {
    if (paused || heroProducts.length < 2) return;
    intervalRef.current = setInterval(() => {
      setIndex((i) => (i === heroProducts.length - 1 ? 0 : i + 1));
    }, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, heroProducts.length]);

  if (heroProducts.length === 0) return null;

  // Pause on hover/focus
  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);
  const handleFocus = () => setPaused(true);
  const handleBlur = () => setPaused(false);

  // Keep badge + carousel perfectly centered by sharing the same width container
  const containerWidths =
    "w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto";

  return (
    <div className="flex flex-col items-center p-2 sm:p-4 mt-8 sm:mt-10 w-full">
      {/* Product Carousel */}
      <div
        className={`relative flex flex-col items-center ${containerWidths}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        tabIndex={0}
        aria-label="Featured products carousel"
      >
        {/* Product Image (no card, just image) */}
        <div className="flex flex-col w-full items-center">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] xl:w-[32rem] xl:h-[32rem] mb-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="w-full h-full flex items-center justify-center"
              >
                <HeroProduct product={current} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
