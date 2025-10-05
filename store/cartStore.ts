import { Product, ProductImage } from "@/lib/schema";
import { create } from "zustand";
import { persist } from "zustand/middleware";
// Best-effort server persistence for authenticated users
import { upsertAuthCart } from "@/app/checkout/actions";

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
  getTotalWeight: () => number;
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
            const next = {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              ),
            };
            // Persist cart if authenticated (server action no-ops otherwise)
            try { void upsertAuthCart(next.items as any); } catch {}
            return next;
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

          const next = { items: [...state.items, newItem] };
          try { void upsertAuthCart(next.items as any); } catch {}
          return next;
        }),
      removeFromCart: (id) =>
        set((state) => {
          const next = { items: state.items.filter((item) => item.id !== id) };
          try { void upsertAuthCart(next.items as any); } catch {}
          return next;
        }),
      updateQuantity: (id, quantity) =>
        set((state) => {
          const next = {
            items: state.items
              .map((item) => (item.id === id ? { ...item, quantity } : item))
              .filter((item) => item.quantity > 0),
          };
          try { void upsertAuthCart(next.items as any); } catch {}
          return next;
        }),
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
      getTotalWeight: () => {
        return get().items.reduce((total, item) => {
          if (!item.weight || !item.weight_unit) {
            return total;
          }

          let weightInGrams = 0;
          switch (item.weight_unit) {
            case 'g':
              weightInGrams = item.weight;
              break;
            case 'oz':
              weightInGrams = item.weight * 28.3495;
              break;
            case 'lb':
              weightInGrams = item.weight * 453.592;
              break;
            case 'kg':
              weightInGrams = item.weight * 1000;
              break;
          }

          return total + weightInGrams * item.quantity;
        }, 0);
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
