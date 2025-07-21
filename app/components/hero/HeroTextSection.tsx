import { Anton } from "next/font/google";
import { Button } from "@/components/ui/button";
const headerFont = Anton({ subsets: ["latin"], weight: ["400"] });

const TAGLINES = [
  "You're only a ride away from a good day",
  "Zevlin. Anything else would be nuts",
];

export default function HeroTextSection() {
  const randomTagline = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];
  return (
    <div className="flex-1 space-y-8 lg:pr-12 min-w-[300px]">
      <div className="grid justify-center space-y-4 sm:justify-start">
        <h1
          style={{ ...headerFont.style }}
          className="mx-auto w-min text-7xl font-black tracking-wider leading-none uppercase md:text-7xl lg:text-9xl"
        >
          Goods <span className="whitespace-nowrap">for your</span> Goods
        </h1>

        <p className="text-xl font-light text-black sm:text-left md:text-2xl dark:text-gray-300 backdrop-blur-sm w-fit">
          {randomTagline}
        </p>
      </div>

      <Button
        size="lg"
        className="py-4 px-8 text-lg font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700"
      >
        Shop Zevlin Gear
      </Button>
    </div>
  );
}
