"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Trash2,
  Loader2,
  Minus,
  Plus,
  ChevronRight,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import MainLayout from "@/app/components/layouts/MainLayout";
import { useMemo } from "react";

export default function CartPage() {
  const {
    items: cartItems,
    updateQuantity,
    removeFromCart,
    getTotalPrice,
    hydrated,
  } = useCartStore();

  // money
  const subtotal = getTotalPrice() / 100;
  const shipping = subtotal >= 49 ? 0 : cartItems.length > 0 ? 5.0 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  // free shipping progress (target $49)
  const freeShipTarget = 49;
  const progress = useMemo(() => {
    if (subtotal >= freeShipTarget) return 100;
    return Math.max(0, Math.min(100, Math.round((subtotal / freeShipTarget) * 100)));
  }, [subtotal]);

  const bumpQty = (id: string, delta: number, current: number) => {
    const next = Math.max(1, current + delta);
    updateQuantity(id, next);
  };

  // Loading state
  if (!hydrated) {
    return (
      <MainLayout>
        <div className="pt-40 min-h-screen bg-white text-gray-900 dark:bg-neutral-900 dark:text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">Shopping Cart</h1>
            <div className="py-20 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading your cart…</p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isEmpty = cartItems.length === 0;

  return (
    <MainLayout>
      <div className="pt-40 min-h-screen bg-white text-gray-900 dark:bg-neutral-900 dark:text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-4 sm:mb-8 flex items-end justify-between">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">Shopping Cart</h1>
            {!isEmpty && (
              <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Truck className="h-4 w-4" />
                {subtotal >= freeShipTarget ? (
                  <span>Free shipping unlocked</span>
                ) : (
                  <span>${(freeShipTarget - subtotal).toFixed(2)} away from free shipping</span>
                )}
              </div>
            )}
          </div>

          {/* Free shipping progress (mobile-first) */}
          {!isEmpty && (
            <div className="lg:hidden mb-4">
              <div className="flex items-center justify-between text-[12px] text-gray-600 dark:text-gray-400 mb-1">
                <span className="inline-flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" />
                  {subtotal >= freeShipTarget ? "Free shipping unlocked" : "Free shipping progress"}
                </span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-500 ease-in-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {subtotal < freeShipTarget && (
                <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  ${Math.max(0, freeShipTarget - subtotal).toFixed(2)} to go
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
            {/* Items */}
            <div className="lg:col-span-2">
              {isEmpty ? (
                <div className="py-12 sm:py-20 text-center">
                  <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-4">
                    Your cart is empty.
                  </p>
                  <Button asChild>
                    <Link href="/products" className="inline-flex items-center gap-2">
                      Continue shopping <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <ul role="list" className="space-y-3 sm:space-y-4">
                  {cartItems.map((item) => (
                    <li
                      key={item.id}
                      className="
                        rounded-xl border border-black/5 dark:border-white/10
                        bg-white dark:bg-neutral-800
                        shadow-sm
                        p-3 sm:p-4
                        flex items-start gap-3 sm:gap-4
                      "
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 overflow-hidden rounded-md ring-1 ring-black/5 dark:ring-white/10 bg-white">
                        <Image
                          src={item.featured_image}
                          alt={item.name}
                          width={96}
                          height={96}
                          className="h-full w-full object-contain"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-medium leading-tight line-clamp-2">
                              <Link href="#">{item.name}</Link>
                            </h3>
                            <div className="mt-1 text-[12px] text-gray-500 dark:text-gray-400">
                              ${ (item.price_cents / 100).toFixed(2) } each
                            </div>
                          </div>

                          {/* Line total */}
                          <div className="text-right">
                            <div className="text-sm sm:text-base font-semibold tabular-nums">
                              ${( (item.price_cents / 100) * item.quantity ).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="mt-3 flex items-center justify-between">
                          {/* Quantity stepper */}
                          <div className="inline-flex items-center rounded-md ring-1 ring-black/10 dark:ring-white/15 overflow-hidden">
                            <button
                              className="h-8 w-8 grid place-items-center hover:bg-gray-100 dark:hover:bg-neutral-700"
                              onClick={() => bumpQty(item.id, -1, item.quantity)}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(item.id, parseInt(e.target.value) || 1)
                              }
                              className="
                                h-8 w-14 border-0 text-center
                                focus-visible:ring-0 focus-visible:ring-offset-0
                                bg-transparent
                                text-sm
                              "
                            />
                            <button
                              className="h-8 w-8 grid place-items-center hover:bg-gray-100 dark:hover:bg-neutral-700"
                              onClick={() => bumpQty(item.id, +1, item.quantity)}
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Remove */}
                          <Button
                            variant="ghost"
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Remove item"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Summary */}
            {!isEmpty && (
              <aside className="lg:col-span-1">
                <div
                  className="
                    rounded-xl border border-black/5 dark:border-white/10
                    bg-gray-50 dark:bg-neutral-800
                    p-5 shadow-sm
                    sticky top-28
                  "
                >
                  <h2 className="text-base font-semibold mb-4">Order summary</h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="tabular-nums">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                      <span className="tabular-nums">
                        {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tax</span>
                      <span className="tabular-nums">${tax.toFixed(2)}</span>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-base font-bold">
                      <span>Total</span>
                      <span className="tabular-nums">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button className="mt-5 w-full" size="lg" asChild>
                    <Link href="/checkout" className="inline-flex items-center justify-center gap-2">
                      Checkout <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  {/* Desktop free shipping hint */}
                  <div className="hidden lg:block mt-4 text-[12px] text-gray-500 dark:text-gray-400">
                    {subtotal >= freeShipTarget ? (
                      "You’ve unlocked free shipping."
                    ) : (
                      <>
                        Spend <span className="font-medium">${(freeShipTarget - subtotal).toFixed(2)}</span> more to unlock free shipping.
                      </>
                    )}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>

        {/* Mobile sticky checkout bar */}
        {!isEmpty && (
          <div className="
            lg:hidden fixed bottom-0 left-0 right-0
            border-t bg-white/95 dark:bg-neutral-900/95
            backdrop-blur supports-[backdrop-filter]:bg-white/70
            px-4 py-2
            flex items-center gap-3
          " style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
            <div className="flex-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
              <div className="text-base font-semibold tabular-nums">${total.toFixed(2)}</div>
            </div>
            <Button asChild className="">
              <Link href="/checkout" className="inline-flex items-center justify-center gap-2">
                Checkout <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
