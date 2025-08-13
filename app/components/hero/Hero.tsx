
"use client";
import { ArrowRight, Loader2 } from "lucide-react";
import HeroTextSection from "./HeroTextSection";
import HeroBackground from "./HeroBackground";
import HeroProductGrid from "./HeroProductsGrid";
import useHeroProducts from "@/hooks/useHeroProducts";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Hero() {
  const { products: heroProducts, loading, error } = useHeroProducts();
  const [showCue, setShowCue] = useState(true);

  // Hide scroll cue after small scroll
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 40) setShowCue(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pt-12 md:pt-0">
      <HeroBackground />

      <div className="container relative z-20 mx-auto flex w-full flex-grow items-center justify-center px-4 pt-28 sm:pt-32 lg:px-6">
        <div className="flex w-full flex-wrap items-center justify-center gap-10 py-10 text-center sm:text-left md:flex-nowrap">
          <HeroTextSection />

          {/* Right: products / states */}
          <div className="w-full md:w-1/2">
            {loading ? (
              null
            ) : error ? (
              <div className="mx-auto max-w-sm rounded-xl border border-rose-400/30 bg-rose-50/60 p-4 text-rose-700 dark:border-rose-400/20 dark:bg-rose-900/20 dark:text-rose-200">
                Couldn’t load featured products. Please refresh.
              </div>
            ) : (
              <motion.div initial={{opacity:0}} animate={{opacity:100}}>
              <HeroProductGrid products={heroProducts} />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {showCue && <ScrollCue />}
    </section>
  );
}

function ScrollCue() {
  return (
    <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-black dark:text-gray-200">
      <div className="flex flex-col items-center space-y-2 animate-pulse">
        <div className="text-xs font-medium">Scroll to explore</div>
        <ArrowRight className="h-4 w-4 rotate-90" />
      </div>
    </div>
  );
}
