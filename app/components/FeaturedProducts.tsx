import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useFeaturedProducts from "@/hooks/useFeaturedProducts";
import { Product } from "@/store/cartStore";
import Image from "next/image";

export default function FeaturedProducts() {
  const products = useFeaturedProducts();
  return (
    <section id="products" className="py-20 bg-gray-800/50">
      <div className="container px-4 mx-auto lg:px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Ride Essentials, Perfected
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Engineered for cyclists who demand performance and style without
            compromise.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <FeaturedProductCard product={p} key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

const FeaturedProductCard = ({ product }: { product: Product }) => {
  return (
    <Card className="bg-gray-800 border-gray-700 transition-all duration-300 group hover:border-blue-500/50">
      <CardContent className="p-6">
        <div className="flex relative justify-center items-center mb-6 w-full h-48 rounded-lg transition-transform duration-300 group-hover:scale-105">
          <Image
            alt={product.name}
            src={product.image}
            fill
            className="object-contain"
          />
        </div>
        <Badge className="mb-3 text-orange-400 bg-orange-500/10 border-orange-500/20">
          {product.categories[0] || "Cycling Product"}
        </Badge>
        <h3 className="mb-2 text-xl font-semibold">{product.name}</h3>
        <p className="mb-4 text-gray-400">{product.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-blue-400">
            ${product.price}
          </span>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
