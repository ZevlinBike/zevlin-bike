import { Product } from "@/lib/schema";
import Image from "next/image";
import Link from "next/link";

export default function HeroProduct({ product }: { product: Product }) {
  return (
    <Link className="flex relative flex-col items-center text-center group" href={`/products?focus=${product.slug}`}>
      {/* Outer container with glow and spacing */}
      <div className="relative w-[350px] h-[350px] lg:w-[400px] lg:h-[400px] xl:w-[500px] xl:w-[500px]">
        {/* Glow effect behind product */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r  from-pink-400/70 via-white to-sky-400/70 blur-3xl aspect-square rounded-full animate-spin [animation-duration:7s]" />

        {/* Product image */}
        <div className="relative z-10 w-full h-full">
          <Image
            src={product?.product_images?.[0]?.url || ""}
            alt={product.name}
            fill
            className="object-contain p-8"
          />
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 top-3 z-20 px-4 -translate-y-1/2 py-1.5 text-sm font-medium tracking-wide text-black/90 backdrop-blur-md bg-white/10 rounded-full shadow-lg shadow-black/20 transition-all duration-300 hover:bg-blue-500/20 hover:text-blue-700 hover:border-blue-300/40">
          ${(product.price_cents / 100).toFixed(2)}
        </div>
        <h3 className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap translate-y-1/2 text-lg font-medium tracking-wide text-black/90 backdrop-blur-md bg-white/5 rounded-full  px-3 py-1 shadow-sm shadow-black/20 transition-all duration-300 hover:bg-blue-500/10 hover:border-blue-400/20 hover:text-blue-700">
          {product.name}
        </h3>
      </div>

    </Link>
  );
}
