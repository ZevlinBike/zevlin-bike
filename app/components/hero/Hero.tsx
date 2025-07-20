import { ArrowRight } from "lucide-react";
import HeroTextSection from "./HeroTextSection";
import HeroBackground from "./HeroBackground";
import HeroProductGrid from "./HeroProductsGrid";
import useHeroProducts from "@/hooks/useHeroProducts";

export default function Hero() {
  const heroProducts = useHeroProducts();
  return (
    // Adjust height to use min-h-screen for flexibility,
    // and rely on padding for spacing.
    // The pt-20 from a fixed nav is crucial.
    <section className="flex overflow-hidden relative flex-col justify-center p-8 pt-32 min-h-screen">
      <HeroBackground />

      {/* Content Container - removed fixed height, relying on min-h-screen of parent */}
      <div className="container flex relative z-10 flex-grow justify-center items-center px-4 mx-auto lg:px-6">
        {/* Inner content wrapper for text and products */}
        {/* Removed min-h-screen here to let parent control overall section height */}
        <div className="flex flex-wrap gap-12 justify-center items-center py-10 w-full text-center sm:text-left lg:flex-nowrap">
          <HeroTextSection />
          <HeroProductGrid products={heroProducts} />
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 z-10 text-black animate-bounce -translate-x-1/2 dark:text-gray-200">
        <div className="flex flex-col items-center space-y-2">
          <div className="text-xs font-medium">Scroll to explore</div>
          <ArrowRight className="w-4 h-4 rotate-90" />
        </div>
      </div>
    </section>
  );
}
