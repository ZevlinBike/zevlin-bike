import { products } from "@/utils/products";

export default function useHeroProducts() {
  return products.filter(
    (product) => product.id === "1" || product.id === "2" || product.id === "3",
  );
}
