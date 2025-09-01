import { Anton } from "next/font/google";
import Link from "next/link";
const headerFont = Anton({ subsets: ["latin"], weight: ["400"] });

export default function HeroTextSection() {
  const tagline = "Zevlin. Riding without it is just nuts"
  return (
    <div className="flex-1 flex flex-col items-center md:items-start max-w-4xl px-4 md:px-0 space-y-8">
      <div className="w-full space-y-4">
        <h1
          style={{ ...headerFont.style }}
          className="text-6xl md:text-7xl lg:text-9xl font-black text-black dark:text-white tracking-wider leading-none uppercase text-center md:text-left"
        >
          Goods <span className="whitespace-nowrap">for your</span> Goods
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl font-light text-black dark:text-white dark:text-gray-300 backdrop-blur-sm w-full text-center md:text-left">
          {tagline}
        </p>
      </div>

      <Link
        href="/products"
        className="py-4 px-8 whitespace-nowrap text-lg font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 block mx-auto md:mx-0"
      >
        Shop Zevlin Gear
      </Link>
    </div>
  );
}
