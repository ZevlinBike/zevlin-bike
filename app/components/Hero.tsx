import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

const TAGLINES = [
  "You're only a ride away from a good day",
  "Zevlin. Anything else would be nuts",
  "Goods for your goods",
];

export default function Hero() {
  const randomTagline = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];

  return (
    <section className="flex overflow-hidden relative justify-center items-center p-8 pt-20 min-h-screen">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-white dark:from-gray-900 dark:via-gray-800 dark:to-black" />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-white to-transparent dark:from-gray-900 dark:via-gray-800 dark:to-black" />

      {/* Optional textured grid */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Faint hero background image */}
      <Image
        className="object-cover absolute inset-0 z-0 w-full h-full opacity-20 brightness-150 grayscale"
        src="/images/hero-image.png"
        alt="Zevlin Hero"
        fill
        priority
      />

      {/* Content */}
      <div className="container relative z-10 px-4 mx-auto lg:px-6">
        <div className="flex flex-wrap gap-12 justify-center items-center py-20 min-h-screen text-center sm:text-left lg:flex-nowrap">
          {/* Text Section */}
          <div className="flex-1 space-y-8 lg:pr-12 min-w-[300px]">
            <div className="grid justify-center space-y-4 sm:justify-start">
              <Badge className="py-2 px-4 text-sm font-medium text-red-700 border-red-700 bg-red-700/10 w-fit">
                Cycling Essentials
              </Badge>

              <h1 className="text-7xl font-bold leading-none md:text-7xl lg:text-8xl">
                <span className="block text-black dark:text-white">Zevlin</span>
                <span className="block text-red-700 dark:text-red-500">
                  Bike
                </span>
              </h1>

              <p className="max-w-md text-xl font-light text-black sm:text-left md:text-2xl dark:text-gray-300">
                {randomTagline}
              </p>

              <p className="text-gray-700 dark:text-gray-400 text-md">
                Premium cycling gear engineered for performance and style.
              </p>
            </div>

            <div className="pt-4">
              <Button
                size="lg"
                className="py-4 px-8 text-lg font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700"
              >
                Shop Zevlin Gear
              </Button>
            </div>
          </div>

          {/* Product Image Section */}
          <div className="relative flex-1 mx-auto min-w-[260px] group sm:max-w-[400px]">
            {/* Glow background */}
            <div className="absolute inset-0 bg-gradient-to-r transform scale-110 pointer-events-none from-blue-600/20 to-purple-600/20 blur-3xl" />

            {/* Featured label */}
            <div className="absolute top-4 left-4 z-20 py-1 px-3 text-xs font-semibold text-gray-800 rounded-full shadow dark:text-white bg-white/80 dark:bg-black/50">
              Featured Product
            </div>

            {/* Product image in styled wrapper */}
            <div className="flex relative justify-center items-center rounded-full border shadow-2xl border-white/25 backdrop-blur-sm aspect-square">
              <Image
                src="/images/zevlin-crack-00.webp"
                alt="Zevlin Crack"
                fill
                className="object-contain p-20 mx-auto transition-transform duration-700 group-hover:scale-105"
              />

              {/* Hover price bubble */}
              <div className="absolute right-4 bottom-4 py-1 px-4 text-sm font-semibold text-white bg-blue-600 rounded-full shadow">
                $23.99
              </div>
            </div>

            {/* Subtle glow elements */}
            <div className="absolute -left-12 top-1/4 w-24 h-24 rounded-full bg-blue-500/10 blur-xl" />
            <div className="absolute -right-12 bottom-1/4 w-32 h-32 rounded-full bg-purple-500/10 blur-xl" />
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 text-black animate-bounce transform -translate-x-1/2 dark:text-gray-200">
        <div className="flex flex-col items-center space-y-2">
          <div className="text-xs font-medium">Scroll to explore</div>
          <ArrowRight className="w-4 h-4 rotate-90" />
        </div>
      </div>
    </section>
  );
}
