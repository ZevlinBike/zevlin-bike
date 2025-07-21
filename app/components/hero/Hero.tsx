import { ArrowRight } from "lucide-react";
import HeroTextSection from "./HeroTextSection";
import HeroBackground from "./HeroBackground";
import HeroProductGrid from "./HeroProductsGrid";
import useHeroProducts from "@/hooks/useHeroProducts";

export default function Hero() {
  const heroProducts = useHeroProducts();
  return (
    // The section now has balanced vertical padding (py-8 for example)
    // and relies on the content container's top margin to clear the fixed nav.
    <section className="flex overflow-hidden relative flex-col justify-center py-8 min-h-screen">
      {" "}
      {/* Adjusted py- */}
      <HeroBackground />
      {/* Content Container - Use mt- to clear fixed nav */}
      <div className="container flex relative z-10 flex-grow justify-center items-center px-4 mx-auto mt-32 lg:px-6">
        {" "}
        {/* <--- KEY CHANGE: Added mt-32/mt-40 here */}
        {/* Inner content wrapper for text and products */}
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
