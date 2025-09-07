"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MainLayout from "@/app/components/layouts/MainLayout";
import { Loader2 } from "lucide-react";
import { finalizeOrder } from "../actions";
import { useCartStore } from "@/store/cartStore";

export default function CheckoutCompletePage() {
  const router = useRouter();
  const search = useSearchParams();
  const { clearCart } = useCartStore();
  const [message, setMessage] = useState<string>("Finalizing your order…");

  useEffect(() => {
    const pi = search.get("payment_intent");
    if (!pi) {
      setMessage("Missing payment information. If you were redirected here from a wallet, please try again.");
      return;
    }
    (async () => {
      try {
        const raw = localStorage.getItem('zevlin:checkout:snapshot');
        if (!raw) {
          setMessage("We couldn't restore your checkout session. Please return to checkout.");
          return;
        }
        const snap = JSON.parse(raw);
        const res = await finalizeOrder(
          pi,
          snap.formData,
          snap.cartItems,
          snap.costs,
        );
        if (res?.success && res.orderId) {
          clearCart();
          router.replace(`/order/${res.orderId}`);
        } else if (res?.errors) {
          const errs = res.errors as Record<string, string[]>;
          const msg = errs._form?.[0] || Object.values(errs)[0]?.[0] || 'We could not finalize your order.';
          setMessage(msg);
        } else {
          setMessage('We could not finalize your order.');
        }
      } catch (e) {
        setMessage((e as Error)?.message || 'An unexpected error occurred.');
      }
    })();
  }, [router, search, clearCart]);

  return (
    <MainLayout>
      <div className="pt-40 min-h-screen text-gray-900 bg-white dark:text-white dark:bg-neutral-900">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <h1 className="mb-8 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Completing Checkout
          </h1>
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p>{message}</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
