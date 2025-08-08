import { Product, ProductImage } from "@/lib/schema";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem extends Product {
  quantity: number;
  featured_image: string;
}

interface CartState {
  items: CartItem[];
  hydrated: boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  setHydrated: (hydrated: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      addToCart: (product) =>
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.id === product.id,
          );
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              ),
            };
          }
          const images = Array.isArray(product.product_images)
            ? product.product_images
            : [];
          const featuredImage =
            images.find((img: ProductImage) => img.is_featured)?.url ||
            images[0]?.url ||
            "/images/placeholder.png";

          const newItem = {
            ...product,
            quantity: 1,
            featured_image: featuredImage,
          };

          return {
            items: [...state.items, newItem],
          };
        }),
      removeFromCart: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) => (item.id === id ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0),
        })),
      clearCart: () => set({ items: [] }),
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price_cents * item.quantity,
          0,
        );
      },
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "cart-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
