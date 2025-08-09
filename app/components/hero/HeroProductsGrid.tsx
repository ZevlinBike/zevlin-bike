"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HeroProduct from "./HeroProduct";
import { Product } from "@/lib/schema";
import { Truck } from "lucide-react";

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

  // Auto-scroll logic
  useEffect(() => {
    if (paused || heroProducts.length < 2) return;
    intervalRef.current = setInterval(() => {
      setIndex((i) => (i === heroProducts.length - 1 ? 0 : i + 1));
    }, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, heroProducts.length]);

  if (heroProducts.length === 0) {
    return null;
  }

  // Pause on hover/focus
  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);
  const handleFocus = () => setPaused(true);
  const handleBlur = () => setPaused(false);

  return (
    <div className="flex flex-col items-center p-2 sm:p-4 mt-8 sm:mt-10 w-full">
      {/* Free Shipping pill */}
      <div className="mx-auto mb-5 w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl z-20">
        <span className="
          mx-auto block w-fit rounded-full border border-blue-600/60
          bg-white/70 px-3 py-1 text-center text-xs font-medium text-blue-700
          shadow-sm backdrop-blur dark:border-blue-400/40 dark:bg-neutral-900/70 dark:text-blue-300
        ">
          <span className="inline-flex items-center gap-1">
            <Truck className="h-3.5 w-3.5" />
            <span className="md:hidden">Free Shipping $49+</span>
            <span className="hidden md:inline">Free Shipping on orders over $49</span>
          </span>
        </span>
      </div>      {/* Product Carousel */}
      <div
        className="relative flex flex-col w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto items-center lg:items-end"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        tabIndex={0}
        aria-label="Featured products carousel"
      >
        {/* Product Image (no card, just image) */}
        <div className="flex flex-col w-full items-center lg:items-end">
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 xl:w-[28rem] xl:h-[28rem] mb-4 flex items-center justify-center ">
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
