import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

const TAGLINES = [
  "Premium chamois cream for smooth miles—no tingle, no distractions.",
  "Ride long. Stay calm. No tingle required.",
  "Built for endurance, not intensity. Smooth, simple, and effective.",
  "Comfort that lasts. No burn, no buzz—just friction-free riding.",
  "Menthol-free relief for long rides and cooler days.",
];

export default function Hero() {
  const randomTagline = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];
  return (
    <section className="flex overflow-hidden relative justify-center items-center p-8 pt-16 min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
      <Image
        className="opacity-25 grayscale"
        src="/images/hero-image.png"
        alt="Zevlin Bike Hero"
        fill
        style={{ objectFit: "cover", zIndex: 0 }}
        priority
      />

      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="container relative z-10 px-4 mx-auto lg:px-6">
        <div className="flex flex-wrap gap-12 items-center py-20 min-h-screen text-center sm:text-left lg:flex-nowrap">
          {/* Left side - Text */}
          <div className="flex-1 space-y-8 lg:pr-12 min-w-[300px]">
            <div className="grid justify-center space-y-4 sm:justify-start">
              <div className="inline-block">
                <Badge className="py-2 px-4 text-sm font-medium text-blue-400 bg-blue-500/10 border-blue-500/30">
                  Cycling Essentials
                </Badge>
              </div>

              <h1 className="text-7xl font-bold leading-none md:text-7xl lg:text-8xl">
                <span className="block text-white">Zevlin</span>
                <span className="block text-blue-400">Crack</span>
              </h1>

              <p className="max-w-md text-xl font-light text-center text-gray-300 sm:text-left md:text-2xl">
                {randomTagline}
              </p>
            </div>

            <div className="space-y-3 text-gray-400">
              <div className="flex justify-center items-center space-x-3 sm:justify-start">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                <span className="text-sm font-medium">
                  High Mileage Formula
                </span>
              </div>
              <div className="flex justify-center items-center space-x-3 sm:justify-start">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                <span className="text-sm font-medium">
                  Long-lasting formula
                </span>
              </div>
              <div className="flex justify-center items-center space-x-3 sm:justify-start">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                <span className="text-sm font-medium">
                  Minimizes sweat and moisture
                </span>
              </div>
            </div>

            <div className="pt-4">
              <Button
                size="lg"
                className="py-4 px-8 text-lg font-medium text-white bg-blue-600 rounded-none hover:bg-blue-700"
              >
                Purchase Now
              </Button>
            </div>
          </div>

          {/* Right side - Product Image */}
          <div className="relative flex-1 mx-auto min-w-[260px] max-w-[400px]">
            {/* Glow effect behind product */}
            <div className="absolute inset-0 bg-gradient-to-r transform scale-110 from-blue-600/20 to-purple-600/20 blur-3xl" />

            {/* Product showcase */}
            <div className="flex overflow-hidden relative justify-center items-center rounded-full border shadow-2xl border-white/25 backdrop-blur-sm aspect-square group">
              <div className="space-y-4 text-center">
                <Image
                  src="/images/zevlin-crack-00.webp"
                  alt="Zevlin Crack"
                  fill
                  className="object-contain p-20 mx-auto transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>

            {/* Floating price/info */}
            <div className="flex absolute bottom-0 left-1/2 justify-between items-center p-4 w-1/2 bg-black rounded-lg -translate-x-1/2">
              <div className="text-lg font-semibold text-white">$24.99</div>
              <div className="text-sm text-gray-400">Free shipping</div>
            </div>

            {/* Ambient glow */}
            <div className="absolute -left-12 top-1/4 w-24 h-24 rounded-full bg-blue-500/10 blur-xl" />
            <div className="absolute -right-12 bottom-1/4 w-32 h-32 rounded-full bg-purple-500/10 blur-xl" />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 text-gray-400 animate-bounce transform -translate-x-1/2">
        <div className="flex flex-col items-center space-y-2">
          <div className="text-xs font-medium">Scroll to explore</div>
          <ArrowRight className="w-4 h-4 rotate-90" />
        </div>
      </div>
    </section>
  );
}
