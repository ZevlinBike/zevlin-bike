import { Product } from "@/lib/schema";
import Image from "next/image";

export default function HeroProduct({ product }: { product: Product }) {
  return (
    <div className="flex relative flex-col items-center text-center group">
      {/* Outer container with glow and spacing */}
      <div className="relative bg-gradient-to-br rounded-full border shadow-2xl transition-transform duration-500 group-hover:scale-105 w-[220px] h-[220px] border-white/20 from-black/40 via-white/70 to-black/30 sm:w-[240px] sm:h-[240px]">
        {/* Glow effect behind product */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 blur-2xl" />

        {/* Product image */}
        <div className="relative z-10 w-full h-full">
          <Image
            src={product?.product_images?.[0]?.url || ""}
            alt={product.name}
            fill
            className="object-contain p-10"
          />
        </div>

        {/* Floating price bubble */}
        <div className="absolute right-3 bottom-3 z-20 py-1 px-3 text-sm font-semibold text-white bg-blue-600 rounded-full shadow-md">
          ${(product.price_cents / 100).toFixed(2)}
        </div>
      </div>

      {/* Product name below circle */}
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {product.name}
        </h3>
      </div>
    </div>
  );
}
