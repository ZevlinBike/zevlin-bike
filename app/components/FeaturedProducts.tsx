import { Rating } from "@/components/Rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useFeaturedProducts from "@/hooks/useFeaturedProducts";
import { Product } from "@/store/cartStore";
import Image from "next/image";

// --- FeaturedProducts Component ---
export default function FeaturedProducts() {
  const products = useFeaturedProducts();
  return (
    // Added a subtle gradient background to separate from hero
    <section
      id="products"
      className="py-20 bg-gradient-to-b from-white to-gray-100 dark:from-black dark:to-neutral-900"
    >
      <div className="container px-4 mx-auto lg:px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
            Ride Essentials, Perfected
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {" "}
          {/* Added sm:grid-cols-2 for better tablet layout */}
          {products.map((p, i) => (
            <FeaturedProductCard product={p} key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// --- FeaturedProductCard Component ---
const FeaturedProductCard = ({ product }: { product: Product }) => {
  return (
    <Card className="overflow-hidden relative bg-white rounded-xl border border-gray-200 shadow-md transition-all duration-300 dark:bg-gray-800 dark:border-gray-700 hover:border-blue-500 hover:shadow-xl group">
      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none group-hover:opacity-100 bg-blue-500/5 blur-xl" />

      <CardContent className="flex flex-col p-6 h-full">
        <div className="flex overflow-hidden relative justify-center items-center mb-6 w-full aspect-square bg-gray-50 rounded-lg transition-transform duration-300 dark:bg-gray-700 group-hover:scale-[1.03]">
          <Image
            alt={product.name}
            src={product.image}
            fill
            className="object-contain p-4" // Added padding to image
          />
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-center ">
          <Badge className="mb-3 text-red-700 border dark:text-red-300 bg-red-700/10 border-red-700/20 dark:bg-red-700/20 dark:border-red-700/30">
            {product.categories[0] || "Cycling Product"}
          </Badge>
          <Rating rating={product.rating}/>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            {product.name}
          </h3>
          <p className="flex-grow mb-4 text-sm text-gray-600 dark:text-gray-400">
            {product.description}
          </p>
        </div>
        <div className="flex justify-between items-center pt-4 mt-auto border-t border-gray-100 dark:border-gray-700">
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ${product.price.toFixed(2)}
          </span>
          <Button
            size="sm"
            className="text-white bg-blue-600 transition-colors duration-300 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

