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
        <div className="relative flex mx-auto w-fit">
          <div className="bg-black text-white px-4 rounded-l-full border border-black">
            ${(product.price_cents / 100).toFixed(2)}
          </div>
          <h3 className="text-black dark:text-white px-4 border-r border-t border-b rounded-r-full backdrop-blur-lg bg-white/10">
            {product.name}
          </h3>
        </div>
      </div>

    </Link>
  );
}
