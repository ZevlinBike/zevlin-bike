import { ArrowRight } from "lucide-react";
import HeroTextSection from "./HeroTextSection";
import HeroBackground from "./HeroBackground";
import HeroProductGrid from "./HeroProductsGrid";
import useHeroProducts from "@/hooks/useHeroProducts";

export default function Hero() {
  const heroProducts = useHeroProducts();
  return (
    <section className="flex overflow-hidden relative flex-col justify-center py-8 min-h-screen">
      <HeroBackground />
      <div className="container flex relative z-10 flex-grow justify-center items-center px-4 mx-auto mt-32 lg:px-6">
        <div className="flex flex-wrap gap-12 justify-center items-center py-10 w-full text-center sm:text-left lg:flex-nowrap">
          <HeroTextSection />
          <HeroProductGrid products={heroProducts} />
        </div>
      </div>
      <ScrollCue />
    </section>
  );
}


function ScrollCue(){
  return(
      <div className="absolute bottom-8 left-1/2 z-10 text-black animate-bounce -translate-x-1/2 dark:text-gray-200">
        <div className="flex flex-col items-center space-y-2">
          <div className="text-xs font-medium">Scroll to explore</div>
          <ArrowRight className="w-4 h-4 rotate-90" />
        </div>
      </div>
  )
}
