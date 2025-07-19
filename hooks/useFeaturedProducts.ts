import { products } from "@/utils/products";

// TODO: Fetch Products that are marked to be featured
export default function useFeaturedProducts() {
  return products.filter((p) => p.featured);
}
