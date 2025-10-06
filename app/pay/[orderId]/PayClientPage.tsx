"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PayForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });
      if (error) {
        setError(error.message || "Payment failed. Please try again.");
        setSubmitting(false);
        return;
      }
      if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
        window.location.href = `/order/${orderId}`;
        return;
      }
      setSubmitting(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }, [stripe, elements, orderId]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-800 px-3 py-2 text-sm">
          {error}
        </div>
      )}
      <Button type="submit" disabled={!stripe || submitting} className="w-full">
        {submitting ? "Processing…" : "Pay Now"}
      </Button>
      <div className="text-center text-xs text-neutral-500">
        You will receive an order confirmation after successful payment.
      </div>
    </form>
  );
}

export default function PayClientPage({ clientSecret, invoiceId }: { clientSecret: string; invoiceId: string }) {
  const [displayAmount, setDisplayAmount] = useState<number | null>(null);
  useState(() => {
    (async () => {
      try {
        const stripe = await stripePromise;
        if (!stripe) return;
        const res = await stripe.retrievePaymentIntent(clientSecret);
        const amt = res.paymentIntent?.amount ?? null;
        if (typeof amt === 'number') setDisplayAmount(amt);
      } catch {}
    })();
  });
  return (
    <div className="pt-40 pb-24 min-h-screen bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Complete Payment</CardTitle>
              <div className="text-sm text-neutral-600 dark:text-neutral-300">Invoice #{invoiceId}{displayAmount != null ? ` · Total $${(displayAmount/100).toFixed(2)}` : ''}</div>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PayForm orderId={invoiceId} />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
