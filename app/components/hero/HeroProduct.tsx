import { Product } from "@/lib/schema";
import Image from "next/image";
import Link from "next/link";

export default function HeroProduct({ product, disableClick = false }: { product: Product; disableClick?: boolean }) {
  return (
    <Link
      className="flex relative flex-col items-center text-center group"
      href={`/products/${product.slug}`}
      draggable={false}
      onClick={(e) => {
        if (disableClick) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {/* Outer container with glow and spacing */}
      <div className="relative w-[350px] h-[350px] lg:w-[400px] lg:h-[400px] xl:w-[500px] xl:w-[500px]">
        {/* Glow effect behind product */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r  from-pink-400/70 via-white to-sky-400/70 blur-3xl aspect-square rounded-full animate-spin [animation-duration:7s] pointer-events-none select-none" />

        {/* Product image */}
        <div className="relative z-10 w-full h-full pointer-events-none select-none">
          <Image
            src={product?.product_images?.[0]?.url || ""}
            alt={product.name}
            fill
            className="object-contain p-8 pointer-events-none select-none"
            draggable={false}
          />
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex mx-auto w-fit z-10 pointer-events-none select-none">
          <div className="bg-black text-white px-4 rounded-l-xl border border-black font-bold whitespace-nowrap pointer-events-none select-none">
            ${(product.price_cents / 100).toFixed(2)}
          </div>
          <h3 className="text-black dark:text-white px-4 border-r border-t border-b border-black rounded-r-xl backdrop-blur-[3px] dark:bg-black/20 whitespace-nowrap pointer-events-none select-none">
            {product.name}
          </h3>
        </div>
      </div>

    </Link>
  );
}
