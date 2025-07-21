import { Product } from "@/store/cartStore";
import HeroProduct from "./HeroProduct";

export default function HeroProductGrid({ products }: { products: Product[] }) {
  const heroProducts = products.slice(0, 2);

  if (heroProducts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center p-4 mt-10">
      {/* Global "Free Shipping" Banner for the Hero Section */}
      <h2 className="mb-6 text-3xl font-extrabold text-center text-gray-900 md:text-4xl dark:text-white">
        Our Top Picks
        <span className="block mt-2 text-lg font-medium backdrop-blur-sm px-1 border border-blue-600 rounded-lg text-blue-600 md:text-xl dark:text-blue-400">
          Plus, get Free Shipping on all orders over $49!
        </span>
      </h2>

      {/* Existing Grid Layout for Two Products */}
      <div className="flex flex-col gap-8 justify-center items-center w-full md:flex-row">
        {heroProducts.map((product) => (
          <div
            key={product.id}
            className="flex-1 mx-auto min-w-[280px] max-w-[320px]"
          >
            <HeroProduct product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
