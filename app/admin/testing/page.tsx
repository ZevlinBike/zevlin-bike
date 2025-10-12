"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Loader2, CreditCard, Truck, Package, ClipboardCheck, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/schema";
import { createPaymentIntent, finalizeOrder, verifyDiscountCode } from "@/app/checkout/actions";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { cn } from "@/lib/utils";

// Stripe setup
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type StatusState = "idle" | "loading" | "ok" | "error";

type StepKey = "setup" | "cart" | "intent" | "payment" | "ship";

function StepIndicator({
  current,
  states,
  onJump,
}: {
  current: StepKey;
  states: Record<StepKey, StatusState>;
  onJump?: (k: StepKey) => void;
}) {
  const steps: { key: StepKey; label: string }[] = [
    { key: "setup", label: "Setup" },
    { key: "cart", label: "Cart" },
    { key: "intent", label: "Intent" },
    { key: "payment", label: "Payment" },
    { key: "ship", label: "Ship" },
  ];
  return (
    <div className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-900/80 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3 overflow-x-auto">
        {steps.map((s, idx) => {
          const state = states[s.key];
          const isActive = current === s.key;
          const color = state === "ok" ? "bg-emerald-500" : state === "error" ? "bg-rose-500" : state === "loading" ? "bg-amber-500" : isActive ? "bg-blue-500" : "bg-neutral-300 dark:bg-neutral-700";
          return (
            <div key={s.key} className="flex items-center">
              <button
                type="button"
                onClick={() => onJump?.(s.key)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  isActive ? "bg-blue-50 dark:bg-neutral-800 text-blue-600 dark:text-blue-300" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                )}
              >
                <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
                <span>{s.label}</span>
              </button>
              {idx < steps.length - 1 && <div className="mx-2 h-px w-6 bg-neutral-200 dark:bg-neutral-700" />}
            </div>
          );
        })}
        <div className="ml-auto" />
      </div>
    </div>
  );
}

type CartItem = { id: string; name: string; price_cents: number; qty: number };

function PaymentSection({
  onPaid,
}: {
  onPaid: (paymentIntentId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const handlePay = useCallback(async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });
      if (error) {
        throw new Error(error.message || "Payment failed");
      }
      const piId = paymentIntent?.id;
      if (!piId) throw new Error("No payment intent ID returned");
      onPaid(piId);
    } catch (e) {
      console.error(e);
      alert((e as Error).message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  }, [stripe, elements, onPaid]);

  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <Button onClick={handlePay} disabled={!stripe || submitting} className="w-full">
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}Pay Test Charge
      </Button>
    </div>
  );
}

export default function AdminTestingPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addr1, setAddr1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");

  const [addressStatus, setAddressStatus] = useState<StatusState>("idle");
  const [addressMsg, setAddressMsg] = useState<string | undefined>(undefined);

  const [piStatus, setPiStatus] = useState<StatusState>("idle");
  const [piMsg, setPiMsg] = useState<string | undefined>(undefined);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const [orderStatus, setOrderStatus] = useState<StatusState>("idle");
  const [orderId, setOrderId] = useState<string | null>(null);

  const [ratesStatus, setRatesStatus] = useState<StatusState>("idle");
  const [rates, setRates] = useState<Array<{ rateObjectId: string; carrier: string; service: string; amountCents: number; currency: string; estimatedDays?: number }>>([]);
  const [selectedRate, setSelectedRate] = useState<string | null>(null);

  const [labelStatus, setLabelStatus] = useState<StatusState>("idle");
  const [label, setLabel] = useState<{ url: string; tracking: string; carrier: string; service: string } | null>(null);

  // Wizard state
  const [step, setStep] = useState<StepKey>("setup");
  const canNext = useMemo(() => {
    if (step === "setup") return addressStatus === "ok";
    if (step === "cart") return cart.length > 0;
    if (step === "intent") return !!clientSecret;
    if (step === "payment") return !!paymentIntentId;
    if (step === "ship") return true;
    return false;
  }, [step, addressStatus, cart.length, clientSecret, paymentIntentId]);

  const stepStates: Record<StepKey, StatusState> = {
    setup: addressStatus,
    cart: cart.length > 0 ? "ok" : "idle",
    intent: piStatus,
    payment: paymentIntentId ? "ok" : clientSecret ? "idle" : "idle",
    ship: labelStatus === "ok" ? "ok" : ratesStatus === "error" || labelStatus === "error" ? "error" : ratesStatus === "ok" || labelStatus === "loading" ? "loading" : "idle",
  };

  // Seed defaults for quick testing
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("products")
          .select("id,name,price_cents")
          .order("created_at", { ascending: true })
          .limit(20);
        if (data) setProducts(data as unknown as Product[]);
      } catch (e) {
        console.warn("Failed to load products", e);
      }
    })();
  }, [supabase]);

  const addToCart = useCallback((p: Product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === p.id);
      if (exists) return prev.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { id: p.id, name: p.name, price_cents: p.price_cents, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, Math.floor(qty)) } : i)).filter((i) => i.qty > 0));
  }, []);

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0); // dollars
  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price_cents * i.qty, 0) / 100, [cart]);
  const shipping = 0; // shipping cost excluded from test payment; label purchase is separate
  const tax = useMemo(() => Math.round(Math.max(0, subtotal - discount) * 0.08 * 100) / 100, [subtotal, discount]);
  const total = useMemo(() => Math.max(0, Math.round(((subtotal - discount) + shipping + tax) * 100) / 100), [subtotal, tax, discount]);

  const validateAddress = useCallback(async () => {
    setAddressStatus("loading");
    setAddressMsg(undefined);
    try {
      const res = await fetch("/api/shipping/validate-address", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          address: {
            name: `${firstName} ${lastName}`.trim(),
            address1: addr1,
            city,
            state,
            postal_code: postal,
            country: "US",
            email,
            phone,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Validation failed");
      if (data?.isValid) {
        setAddressStatus("ok");
        setAddressMsg(data?.messages?.[0] || "Address looks valid");
      } else {
        setAddressStatus("error");
        setAddressMsg(data?.messages?.[0] || "Address seems invalid");
      }
    } catch (e) {
      setAddressStatus("error");
      setAddressMsg((e as Error).message);
    }
  }, [firstName, lastName, addr1, city, state, postal, email, phone]);

  const createPI = useCallback(async () => {
    setPiStatus("loading");
    setPiMsg(undefined);
    setClientSecret(null);
    try {
      const res = await createPaymentIntent({ subtotal, shipping, tax, discount, total });
      if ('error' in res) throw new Error(res.error);
      const cs = res.clientSecret ?? undefined;
      const pid = res.paymentIntentId ?? undefined;
      if (!cs || !pid) throw new Error("Failed to initialize payment");
      setClientSecret(cs);
      setPaymentIntentId(pid);
      setPiStatus("ok");
      setPiMsg(`PI ${pid.slice(0, 10)}…`);
    } catch (e) {
      setPiStatus("error");
      setPiMsg((e as Error).message);
    }
  }, [subtotal, tax, total, discount]);

  const onPaid = useCallback(async (pid: string) => {
    if (!pid) return;
    // finalize order and snapshot items + shipping details
    setOrderStatus("loading");
    try {
      const formData = {
        email,
        phone,
        shippingFirstName: firstName,
        shippingLastName: lastName,
        shippingAddress: addr1,
        shippingCity: city,
        shippingState: state,
        shippingZipCode: postal,
        billingSameAsShipping: true,
      };
      const cartItems = cart.map((i) => ({ id: i.id, name: i.name, price_cents: i.price_cents, quantity: i.qty }));
      const costs = { subtotal, shipping, tax, discount, total };
      // Cast cartItems through unknown to the expected param type without using any
      const res = await finalizeOrder(
        pid,
        formData,
        (cartItems as unknown) as Parameters<typeof finalizeOrder>[2],
        costs,
        { isTraining: true }
      );
      if ('errors' in res) {
        const errs = (res.errors as Record<string, string[] | undefined>);
        throw new Error(errs._form?.[0] ?? 'Order finalization failed');
      }
      const oid = 'orderId' in res ? res.orderId : undefined;
      if (!oid) throw new Error("Order not created");
      setOrderId(oid);
      setOrderStatus("ok");
    } catch {
      setOrderStatus("error");
    }
  }, [email, phone, firstName, lastName, addr1, city, state, postal, cart, subtotal, tax, total, discount]);

  const fetchRates = useCallback(async () => {
    if (!orderId) return;
    setRatesStatus("loading");
    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Rate lookup failed");
      setRates(data.rates || []);
      setRatesStatus("ok");
      if (data.rates?.[0]?.rateObjectId) setSelectedRate(data.rates[0].rateObjectId);
    } catch {
      setRatesStatus("error");
    }
  }, [orderId]);

  const buyLabel = useCallback(async () => {
    if (!orderId || !selectedRate) return;
    setLabelStatus("loading");
    try {
      const res = await fetch("/api/shipping/labels", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, rateObjectId: selectedRate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Label purchase failed");
      setLabel({ url: data.labelUrl, tracking: data.trackingNumber, carrier: data.carrier, service: data.service });
      setLabelStatus("ok");
    } catch {
      setLabelStatus("error");
    }
  }, [orderId, selectedRate]);

  // Collapsible instructions panel
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="min-h-[100dvh]">
      <StepIndicator current={step} states={stepStates} onJump={setStep} />

      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-xl md:text-2xl font-semibold">Checkout & Shipping Tester</h1>
          <div className="ml-auto" />
          <Button variant="secondary" size="sm" onClick={() => setShowInstructions((s) => !s)}>
            <Info className="mr-2 h-4 w-4" /> {showInstructions ? "Hide" : "Show"} Instructions
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {step === "setup" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" />
                    </div>
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label>Address</Label>
                      <Input value={addr1} onChange={(e) => setAddr1(e.target.value)} placeholder="123 Main St" />
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Austin" />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="TX" />
                    </div>
                    <div className="space-y-2">
                      <Label>Postal Code</Label>
                      <Input value={postal} onChange={(e) => setPostal(e.target.value)} placeholder="78701" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button variant="secondary" onClick={validateAddress}>
                      {addressStatus === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}Validate Address
                    </Button>
                    {addressMsg && <div className="text-sm text-neutral-500 dark:text-neutral-400">{addressMsg}</div>}
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button disabled={!canNext} onClick={() => setStep("cart")}>Next</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === "cart" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Cart</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <Select onValueChange={(id) => { const p = products.find((x) => x.id === id); if (p) addToCart(p); }}>
                      <SelectTrigger className="w-full md:w-80">
                        <SelectValue placeholder="Add product to cart" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} • ${(p.price_cents / 100).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-sm text-neutral-500">Select to add 1 item</div>
                  </div>

                  <div className="space-y-2">
                    {cart.length === 0 && <div className="text-sm text-neutral-500">No items yet.</div>}
                    {cart.map((it) => (
                      <div key={it.id} className="flex items-center gap-3">
                        <div className="flex-1 text-sm">{it.name}</div>
                        <div className="w-24 text-right text-sm">${(it.price_cents / 100).toFixed(2)}</div>
                        <div className="w-24">
                          <Input type="number" min={0} value={it.qty}
                            onChange={(e) => updateQty(it.id, Number(e.target.value))} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1">
                      <Label htmlFor="promo">Discount code</Label>
                      <div className="flex gap-2">
                        <Input id="promo" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="e.g. SUMMER20" />
                        <Button type="button" variant="outline" onClick={async () => {
                          if (!promoCode) return;
                          const res = await verifyDiscountCode(promoCode);
                          if ('error' in res) { alert(res.error); return; }
                          const d = res.data as { code: string; type: 'percentage' | 'fixed'; value: number | string };
                          let amt = 0;
                          if (d.type === 'percentage') amt = (subtotal * Number(d.value)) / 100;
                          else if (d.type === 'fixed') amt = Number(d.value);
                          setAppliedPromo(d.code);
                          setDiscount(Math.min(subtotal, Math.max(0, Math.round(amt * 100) / 100)));
                          setPromoCode("");
                        }}>Apply</Button>
                      </div>
                    </div>
                    {appliedPromo && (
                      <div className="text-sm">
                        Applied: <span className="font-mono">{appliedPromo}</span>
                        <Button variant="link" className="ml-2 px-0" onClick={() => { setAppliedPromo(null); setDiscount(0); }}>Remove</Button>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-sm"><div>Subtotal</div><div>${subtotal.toFixed(2)}</div></div>
                  <div className="flex justify-between text-sm"><div>Discount</div><div className={discount ? "text-emerald-600" : undefined}>-{discount.toFixed(2)}</div></div>
                  <div className="flex justify-between text-sm"><div>Tax (8%)</div><div>${tax.toFixed(2)}</div></div>
                  <div className="flex justify-between font-medium"><div>Total</div><div>${total.toFixed(2)}</div></div>

                  <div className="flex justify-between pt-2">
                    <Button variant="secondary" onClick={() => setStep("setup")}>Back</Button>
                    <Button disabled={!canNext} onClick={() => setStep("intent")}>Next</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === "intent" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payment Intent</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={createPI} disabled={cart.length === 0 || addressStatus !== "ok"}>
                      {piStatus === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}Create Payment Intent
                    </Button>
                    {piMsg && <div className="text-sm text-neutral-500">{piMsg}</div>}
                  </div>
                  <div className="flex justify-between pt-2">
                    <Button variant="secondary" onClick={() => setStep("cart")}>Back</Button>
                    <Button disabled={!canNext} onClick={() => setStep("payment")}>Next</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === "payment" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  {!clientSecret ? (
                    <div className="text-sm text-neutral-500">Create a Payment Intent first.</div>
                  ) : (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <PaymentSection onPaid={setPaymentIntentId} />
                    </Elements>
                  )}
                  <div className="flex justify-between pt-4">
                    <Button variant="secondary" onClick={() => setStep("intent")}>Back</Button>
                    <Button disabled={!canNext} onClick={() => setStep("ship")}>Next</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === "ship" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> Finalize & Ship</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Button onClick={() => paymentIntentId && onPaid(paymentIntentId)} disabled={!paymentIntentId || orderStatus === "loading"}>
                      {orderStatus === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Finalize Order
                    </Button>
                    {orderId && <div className="text-sm">Order: <span className="font-mono">{orderId.slice(0, 8)}…</span></div>}
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <Button onClick={fetchRates} disabled={!orderId || ratesStatus === "loading"}>
                      {ratesStatus === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}Get Rates
                    </Button>
                    {rates.length > 0 && (
                      <Select value={selectedRate ?? undefined} onValueChange={(v) => setSelectedRate(v)}>
                        <SelectTrigger className="w-full md:w-80">
                          <SelectValue placeholder="Select a rate" />
                        </SelectTrigger>
                        <SelectContent>
                          {rates.map((r) => (
                            <SelectItem key={r.rateObjectId} value={r.rateObjectId}>
                              {r.carrier} • {r.service} — ${(r.amountCents / 100).toFixed(2)} {r.currency}{r.estimatedDays ? ` • ${r.estimatedDays}d` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button onClick={buyLabel} disabled={!orderId || !selectedRate || labelStatus === "loading"} variant="secondary">
                      {labelStatus === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}Buy Label
                    </Button>
                  </div>

                  {label && (
                    <div className="text-sm">
                      Label: <a href={label.url} target="_blank" className="underline">download</a> • Tracking: <span className="font-mono">{label.tracking}</span>
                    </div>
                  )}

                  <div className="flex justify-start pt-2">
                    <Button variant="secondary" onClick={() => setStep("payment")}>Back</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Instructions panel */}
          <div className="lg:col-span-1">
            <div className={cn(
              "transition-all",
              showInstructions ? "opacity-100 translate-y-0" : "opacity-100 lg:opacity-60"
            )}>
              <Card>
                <CardHeader>
                  <CardTitle>Instructions</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-neutral-600 dark:text-neutral-300">
                  <div>1. Enter address and Validate (Shippo).</div>
                  <div>2. Add products to Cart.</div>
                  <div>3. Create Payment Intent (Stripe).</div>
                  <div>4. Pay with test card 4242…</div>
                  <div>5. Finalize Order in DB.</div>
                  <div>6. Fetch Rates and Buy Label.</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile instructions slide-over */}
      {showInstructions && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowInstructions(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white dark:bg-neutral-900 p-4 shadow-xl max-h-[70vh] overflow-auto">
            <div className="mx-auto max-w-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Instructions</div>
                <Button size="sm" variant="secondary" onClick={() => setShowInstructions(false)}>Close</Button>
              </div>
              <div className="text-sm space-y-2 text-neutral-600 dark:text-neutral-300">
                <div>1. Enter address and Validate (Shippo).</div>
                <div>2. Add products to Cart.</div>
                <div>3. Create Payment Intent (Stripe).</div>
                <div>4. Pay with test card 4242…</div>
                <div>5. Finalize Order in DB.</div>
                <div>6. Fetch Rates and Buy Label.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
