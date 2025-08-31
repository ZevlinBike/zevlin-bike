"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartStore } from "@/store/cartStore";
import MainLayout from "@/app/components/layouts/MainLayout";
import { Loader2, CreditCard, Truck, User, LogIn, UserPlus, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { processCheckout, verifyDiscountCode } from "./actions";
import { login } from "@/app/auth/login/actions";
import { useRouter } from "next/navigation";
import { User as UserType } from "@supabase/supabase-js";
import { Customer } from "@/lib/schema";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutForm {
  email: string;
  phone: string;
  // Shipping
  shippingFirstName: string;
  shippingLastName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  // Billing
  billingSameAsShipping: boolean;
  billingFirstName?: string;
  billingLastName?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZipCode?: string;
}

const CheckoutForm = ({ user, customer }: { user: UserType | null, customer: Customer | null }) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const {
    items: cartItems,
    getTotalPrice,
    clearCart,
    hydrated,
  } = useCartStore();

  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [addressSuggestOpen, setAddressSuggestOpen] = useState(false);
  const [addressSuggestion, setAddressSuggestion] = useState<{
    address1?: string;
    address2?: string | null;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  } | null>(null);
  const [shippingStatus, setShippingStatus] = useState<
    { state: 'idle' | 'validating' | 'valid' | 'invalid'; message?: string; suggested?: typeof addressSuggestion; normalized?: typeof addressSuggestion }
  >({ state: 'idle' });
  const [billingStatus, setBillingStatus] = useState<
    { state: 'idle' | 'validating' | 'valid' | 'invalid'; message?: string; suggested?: typeof addressSuggestion; normalized?: typeof addressSuggestion }
  >({ state: 'idle' });

  const [formData, setFormData] = useState<CheckoutForm>({
    email: user?.email || (customer?.email || ""),
    phone: customer?.phone || "",
    shippingFirstName: customer?.first_name || "",
    shippingLastName: customer?.last_name || "",
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingZipCode: "",
    billingSameAsShipping: true,
    billingFirstName: "",
    billingLastName: "",
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingZipCode: "",
  });

  const [checkoutMode, setCheckoutMode] = useState<'guest' | 'login'>('guest');
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState("");
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    if (user) {
      setCheckoutMode('login');
      if (customer) {
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
          phone: customer.phone || '',
          shippingFirstName: customer.first_name || '',
          shippingLastName: customer.last_name || '',
        }));
      } else if (user && !customer) {
        router.push('/auth/create-profile');
      }
    }
  }, [user, customer, router]);

  const subtotal = getTotalPrice() / 100;
  const shipping = subtotal >= 49 ? 0 : cartItems.length > 0 ? 5.0 : 0;
  const tax = (subtotal - discount) * 0.08;
  const total = subtotal + shipping + tax - discount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === 'shippingState' || name === 'billingState') {
      value = value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);
    }
    if (name === 'shippingZipCode' || name === 'billingZipCode') {
      value = value.replace(/\D/g, '').slice(0, 5);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleBillingSame = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData(prev => ({ ...prev, billingSameAsShipping: checked }));
  };

  async function validateShippingAddress(): Promise<{
    isValid: boolean;
    isComplete?: boolean;
    messages?: string[];
    suggested?: typeof addressSuggestion | undefined;
    normalized?: typeof addressSuggestion | undefined;
  }> {
    const res = await fetch('/api/shipping/validate-address', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        address: {
          name: `${formData.shippingFirstName} ${formData.shippingLastName}`.trim(),
          address1: formData.shippingAddress,
          city: formData.shippingCity,
          state: formData.shippingState,
          postal_code: formData.shippingZipCode,
          country: 'US',
        }
      })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to validate address');
    return json;
  }

  async function validateAddressInline(addr: {
    name?: string;
    address1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  }) {
    const res = await fetch('/api/shipping/validate-address', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address: addr }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to validate address');
    return json as { isValid: boolean; isComplete?: boolean; messages?: string[]; suggested?: typeof addressSuggestion; normalized?: typeof addressSuggestion };
  }

  // Debounced inline validation for shipping address
  useEffect(() => {
    const { shippingAddress, shippingCity, shippingState, shippingZipCode, shippingFirstName, shippingLastName } = formData;
    if (!shippingAddress || !shippingCity || !shippingState || !shippingZipCode) {
      setShippingStatus(s => ({ ...s, state: 'idle', message: undefined, suggested: undefined }));
      return;
    }
    let cancelled = false;
    setShippingStatus({ state: 'validating' });
    const t = setTimeout(async () => {
      try {
        const res = await validateAddressInline({
          name: `${shippingFirstName} ${shippingLastName}`.trim(),
          address1: shippingAddress,
          city: shippingCity,
          state: shippingState,
          postal_code: shippingZipCode,
          country: 'US',
        });
        if (cancelled) return;
        const good = res.isValid && (res.isComplete !== false) && (!res.messages || res.messages.length === 0);
        setShippingStatus({
          state: good ? 'valid' : 'invalid',
          message: res.messages?.[0],
          suggested: res.suggested,
          normalized: res.normalized,
        });
      } catch (e) {
        if (cancelled) return;
        setShippingStatus({ state: 'invalid', message: (e as Error).message });
      }
    }, 600);
    return () => { cancelled = true; clearTimeout(t); };
  }, [formData.shippingAddress, formData.shippingCity, formData.shippingState, formData.shippingZipCode, formData.shippingFirstName, formData.shippingLastName]);

  // Debounced inline validation for billing address (when enabled)
  useEffect(() => {
    if (formData.billingSameAsShipping) {
      setBillingStatus(s => ({ ...s, state: 'idle', message: undefined, suggested: undefined }));
      return;
    }
    const { billingAddress, billingCity, billingState, billingZipCode, billingFirstName, billingLastName } = formData;
    if (!billingAddress || !billingCity || !billingState || !billingZipCode) {
      setBillingStatus(s => ({ ...s, state: 'idle', message: undefined, suggested: undefined }));
      return;
    }
    let cancelled = false;
    setBillingStatus({ state: 'validating' });
    const t = setTimeout(async () => {
      try {
        const res = await validateAddressInline({
          name: `${billingFirstName || ''} ${billingLastName || ''}`.trim(),
          address1: billingAddress!,
          city: billingCity!,
          state: billingState!,
          postal_code: billingZipCode!,
          country: 'US',
        });
        if (cancelled) return;
        const good = res.isValid && (res.isComplete !== false) && (!res.messages || res.messages.length === 0);
        setBillingStatus({
          state: good ? 'valid' : 'invalid',
          message: res.messages?.[0],
          suggested: res.suggested,
          normalized: res.normalized,
        });
      } catch (e) {
        if (cancelled) return;
        setBillingStatus({ state: 'invalid', message: (e as Error).message });
      }
    }, 600);
    return () => { cancelled = true; clearTimeout(t); };
  }, [formData.billingSameAsShipping, formData.billingAddress, formData.billingCity, formData.billingState, formData.billingZipCode, formData.billingFirstName, formData.billingLastName]);

  function applySuggestedAndContinue() {
    if (!addressSuggestion) return;
    setFormData(prev => ({
      ...prev,
      shippingAddress: addressSuggestion.address1 || prev.shippingAddress,
      shippingCity: addressSuggestion.city || prev.shippingCity,
      shippingState: addressSuggestion.state || prev.shippingState,
      shippingZipCode: addressSuggestion.postal_code || prev.shippingZipCode,
    }));
    setAddressSuggestOpen(false);
    // After applying suggestion, submit again
    const form = document.getElementById('checkout-form') as HTMLFormElement | null;
    if (form) {
      // Trigger submit programmatically
      form.requestSubmit();
    }
  }

  const handlePromoCode = async () => {
    const result = await verifyDiscountCode(promoCode);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    const { data: discountData } = result;
    let discountAmount = 0;
    if (discountData.type === 'percentage') {
      discountAmount = (subtotal * discountData.value) / 100;
    } else if (discountData.type === 'fixed') {
      discountAmount = discountData.value;
    }

    setAppliedPromo(discountData.code);
    setDiscount(discountAmount);
    setPromoCode("");
    toast.success("Promo code applied!");
  };

  const removePromoCode = () => {
    setAppliedPromo("");
    setDiscount(0);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const loginFormData = new FormData(e.currentTarget);
    setErrors({});

    startTransition(async () => {
      const result = await login(Object.fromEntries(loginFormData.entries()));

      if (result?.errors) {
        if ("_form" in result.errors && result.errors._form) {
          toast.error(result.errors._form[0]);
        }
        setErrors(result.errors);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // 1) Validate shipping address automatically via Shippo
    try {
      const validation = await validateShippingAddress();
      const good = validation.isValid && (validation.isComplete !== false) && (!validation.messages || validation.messages.length === 0);
      if (!good) {
        const candidate = validation.suggested || validation.normalized;
        if (candidate) {
          setAddressSuggestion(candidate);
          setAddressSuggestOpen(true);
          toast.message('We found a more accurate address.');
        } else {
          toast.error(validation.messages?.[0] || 'The shipping address appears invalid.');
        }
        return; // stop checkout until user reviews
      }
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Address validation failed');
      return;
    }

    // 1b) If billing is not same, validate billing address too
    if (!formData.billingSameAsShipping) {
      try {
        const billingValidation = await validateAddressInline({
          name: `${formData.billingFirstName || ''} ${formData.billingLastName || ''}`.trim(),
          address1: formData.billingAddress || '',
          city: formData.billingCity || '',
          state: formData.billingState || '',
          postal_code: formData.billingZipCode || '',
          country: 'US',
        });
        if (!billingValidation.isValid) {
          toast.error(billingValidation.messages?.[0] || 'The billing address appears invalid.');
          return;
        }
      } catch (err: unknown) {
        toast.error((err as Error)?.message || 'Billing address validation failed');
        return;
      }
    }

    if (!stripe || !elements) {
      toast.error("Payment system is not ready yet. Please wait a moment.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (cardElement == null) {
      toast.error("Could not find payment details form. Please refresh and try again.");
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      toast.error(error.message || "An unexpected error occurred with your card.");
    } else {
      startTransition(async () => {
        const result = await processCheckout(
          formData, 
          cartItems, 
          {
            subtotal,
            shipping,
            tax,
            discount,
            total
          },
          paymentMethod.id
        );

        if (result.errors) {
          if ("_form" in result.errors && result.errors._form) {
            toast.error(result.errors._form[0]);
          }
          setErrors(result.errors);
        } else if (result.success && result.orderId) {
          toast.success("Order placed successfully!");
          clearCart();
          router.push(`/order/${result.orderId}`);
        }
      });
    }
  };

  if (!hydrated) {
    return (
      <MainLayout>
        <div className="pt-40 min-h-screen text-gray-900 bg-white dark:text-white dark:bg-neutral-900">
          <div className="container px-4 mx-auto sm:px-6 lg:px-8">
            <h1 className="mb-8 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Checkout
            </h1>
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Loading your cart...
                </p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <MainLayout>
        <div className="pt-40 min-h-screen text-gray-900 bg-white dark:text-white dark:bg-neutral-900">
          <div className="container px-4 mx-auto sm:px-6 lg:px-8">
            <h1 className="mb-8 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Checkout
            </h1>
            <div className="text-center py-20">
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Your cart is empty.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                <Link href="/products">
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="pt-40 min-h-screen text-gray-900 bg-white dark:text-white dark:bg-neutral-900 pb-20">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <h1 className="mb-8 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Checkout
          </h1>
          
          {!user && <div className="mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant={checkoutMode === 'guest' ? 'default' : 'outline'}
                    onClick={() => setCheckoutMode('guest')}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Guest Checkout
                  </Button>
                  <Button
                    variant={checkoutMode === 'login' ? 'default' : 'outline'}
                    onClick={() => setCheckoutMode('login')}
                    className="flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In & Checkout
                  </Button>
                </div>
                {checkoutMode === 'guest' && (
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    Check out quickly without creating an account. You can still track your order using your email address.
                  </p>
                )}
                {checkoutMode === 'login' && (
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    Sign in to save your information and track your order history.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>}

          {checkoutMode === 'login' && !user ? (
            <div className="max-w-md mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In to Continue</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label htmlFor="email-login" className="block text-sm font-medium mb-2">
                        Email Address
                      </label>
                      <Input
                        id="email-login"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        required
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email[0]}</p>}
                    </div>
                    <div>
                      <label
                        htmlFor="password-login"
                        className="block text-sm font-medium mb-2"
                      >
                        Password
                      </label>
                      <Input
                        id="password-login"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                      />
                      {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password[0]}</p>}
                    </div>
                    <Button type="submit" className="w-full" disabled={isPending}>
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                    </Button>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Don&apos;t have an account?
                        <Link href="/auth/register" className="text-blue-600 hover:underline">
                          Sign up
                        </Link>
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} id="checkout-form" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium mb-2">
                            Email Address *
                          </label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="your@email.com"
                          />
                          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email[0]}</p>}
                        </div>
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium mb-2">
                            Phone Number
                          </label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="(555) 123-4567"
                          />
                           {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone[0]}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Shipping Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                            First Name *
                          </label>
                          <Input
                            id="shippingFirstName"
                            name="shippingFirstName"
                            required
                            value={formData.shippingFirstName}
                            onChange={handleInputChange}
                            placeholder="John"
                          />
                          {errors.shippingFirstName && <p className="text-red-500 text-sm mt-1">{errors.shippingFirstName[0]}</p>}
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                            Last Name *
                          </label>
                          <Input
                            id="shippingLastName"
                            name="shippingLastName"
                            required
                            value={formData.shippingLastName}
                            onChange={handleInputChange}
                            placeholder="Doe"
                          />
                          {errors.shippingLastName && <p className="text-red-500 text-sm mt-1">{errors.shippingLastName[0]}</p>}
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="address" className="block text-sm font-medium mb-2">
                          Street Address *
                        </label>
                        <Input
                          id="shippingAddress"
                          name="shippingAddress"
                          required
                          value={formData.shippingAddress}
                          onChange={handleInputChange}
                          placeholder="123 Main St"
                        />
                        {errors.shippingAddress && <p className="text-red-500 text-sm mt-1">{errors.shippingAddress[0]}</p>}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label htmlFor="city" className="block text-sm font-medium mb-2">
                            City *
                          </label>
                          <Input
                            id="shippingCity"
                            name="shippingCity"
                            required
                            value={formData.shippingCity}
                            onChange={handleInputChange}
                            placeholder="New York"
                          />
                          {errors.shippingCity && <p className="text-red-500 text-sm mt-1">{errors.shippingCity[0]}</p>}
                        </div>
                        <div>
                          <label htmlFor="state" className="block text-sm font-medium mb-2">
                            State *
                          </label>
                          <Input
                            id="shippingState"
                            name="shippingState"
                            required
                            value={formData.shippingState}
                            onChange={handleInputChange}
                            placeholder="NY"
                          />
                          {errors.shippingState && <p className="text-red-500 text-sm mt-1">{errors.shippingState[0]}</p>}
                        </div>
                        <div>
                          <label htmlFor="zipCode" className="block text-sm font-medium mb-2">
                            ZIP Code *
                          </label>
                          <Input
                            id="shippingZipCode"
                            name="shippingZipCode"
                            required
                            value={formData.shippingZipCode}
                            onChange={handleInputChange}
                            placeholder="10001"
                          />
                          {errors.shippingZipCode && <p className="text-red-500 text-sm mt-1">{errors.shippingZipCode[0]}</p>}
                        </div>
                      </div>
                      <div className="text-sm flex items-center gap-2">
                        {shippingStatus.state === 'validating' && (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Validating address…</span>
                          </>
                        )}
                        {shippingStatus.state === 'valid' && (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-green-700 dark:text-green-400">Address looks good</span>
                          </>
                        )}
                        {shippingStatus.state === 'invalid' && (
                          <>
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span className="text-amber-700 dark:text-amber-400">{shippingStatus.message || 'Address may be inaccurate'}</span>
                            {(shippingStatus.suggested || shippingStatus.normalized) && (
                              <Button type="button" variant="link" size="sm" className="px-1" onClick={() => {
                                const src = shippingStatus.suggested || shippingStatus.normalized;
                                if (!src) return;
                                setAddressSuggestion(src || null);
                                setFormData(prev => ({
                                  ...prev,
                                  shippingAddress: src.address1 || prev.shippingAddress,
                                  shippingCity: src.city || prev.shippingCity,
                                  shippingState: src.state || prev.shippingState,
                                  shippingZipCode: src.postal_code || prev.shippingZipCode,
                                }));
                                toast.success('Applied corrected address');
                              }}>
                                Apply correction
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Billing Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <input
                          id="billingSameAsShipping"
                          name="billingSameAsShipping"
                          type="checkbox"
                          checked={formData.billingSameAsShipping}
                          onChange={handleToggleBillingSame}
                        />
                        <label htmlFor="billingSameAsShipping" className="text-sm">
                          Same as shipping
                        </label>
                      </div>

                      {!formData.billingSameAsShipping && (
                        <>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <label htmlFor="billingFirstName" className="block text-sm font-medium mb-2">
                                First Name *
                              </label>
                              <Input
                                id="billingFirstName"
                                name="billingFirstName"
                                value={formData.billingFirstName}
                                onChange={handleInputChange}
                                placeholder="John"
                              />
                              {errors.billingFirstName && <p className="text-red-500 text-sm mt-1">{errors.billingFirstName[0]}</p>}
                            </div>
                            <div>
                              <label htmlFor="billingLastName" className="block text-sm font-medium mb-2">
                                Last Name *
                              </label>
                              <Input
                                id="billingLastName"
                                name="billingLastName"
                                value={formData.billingLastName}
                                onChange={handleInputChange}
                                placeholder="Doe"
                              />
                              {errors.billingLastName && <p className="text-red-500 text-sm mt-1">{errors.billingLastName[0]}</p>}
                            </div>
                          </div>
                          <div>
                            <label htmlFor="billingAddress" className="block text-sm font-medium mb-2">
                              Street Address *
                            </label>
                            <Input
                              id="billingAddress"
                              name="billingAddress"
                              value={formData.billingAddress}
                              onChange={handleInputChange}
                              placeholder="123 Main St"
                            />
                            {errors.billingAddress && <p className="text-red-500 text-sm mt-1">{errors.billingAddress[0]}</p>}
                          </div>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                              <label htmlFor="billingCity" className="block text-sm font-medium mb-2">
                                City *
                              </label>
                              <Input
                                id="billingCity"
                                name="billingCity"
                                value={formData.billingCity}
                                onChange={handleInputChange}
                                placeholder="New York"
                              />
                              {errors.billingCity && <p className="text-red-500 text-sm mt-1">{errors.billingCity[0]}</p>}
                            </div>
                            <div>
                              <label htmlFor="billingState" className="block text-sm font-medium mb-2">
                                State *
                              </label>
                              <Input
                                id="billingState"
                                name="billingState"
                                value={formData.billingState}
                                onChange={handleInputChange}
                                placeholder="NY"
                              />
                              {errors.billingState && <p className="text-red-500 text-sm mt-1">{errors.billingState[0]}</p>}
                            </div>
                            <div>
                              <label htmlFor="billingZipCode" className="block text-sm font-medium mb-2">
                                ZIP Code *
                              </label>
                              <Input
                                id="billingZipCode"
                                name="billingZipCode"
                                value={formData.billingZipCode}
                                onChange={handleInputChange}
                                placeholder="10001"
                              />
                              {errors.billingZipCode && <p className="text-red-500 text-sm mt-1">{errors.billingZipCode[0]}</p>}
                            </div>
                          </div>
                          <div className="text-sm flex items-center gap-2">
                            {billingStatus.state === 'validating' && (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Validating billing address…</span>
                              </>
                            )}
                            {billingStatus.state === 'valid' && (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <span className="text-green-700 dark:text-green-400">Billing address looks good</span>
                              </>
                            )}
                            {billingStatus.state === 'invalid' && (
                              <>
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                <span className="text-amber-700 dark:text-amber-400">{billingStatus.message || 'Billing address may be inaccurate'}</span>
                                {billingStatus.suggested && (
                                  <Button type="button" variant="link" size="sm" className="px-1" onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      billingAddress: billingStatus.suggested?.address1 || prev.billingAddress,
                                      billingCity: billingStatus.suggested?.city || prev.billingCity,
                                      billingState: billingStatus.suggested?.state || prev.billingState,
                                      billingZipCode: billingStatus.suggested?.postal_code || prev.billingZipCode,
                                    }));
                                    toast.success('Applied suggested billing address');
                                  }}>
                                    Use suggested
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Payment Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <CardElement options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': {
                              color: '#aab7c4',
                            },
                          },
                          invalid: {
                            color: '#9e2146',
                          },
                        },
                      }}/>
                    </CardContent>
                  </Card>

                  <div className="lg:hidden">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      disabled={isPending || !stripe}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Complete Order - ${total.toFixed(2)}`
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="font-medium">
                            ${((item.price_cents / 100) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      {appliedPromo ? (
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                              Promo Code Applied
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-300">
                              {appliedPromo} - ${discount.toFixed(2)} off
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={removePromoCode}
                            className="text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100"
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label htmlFor="promoCode" className="block text-sm font-medium">
                            Promo Code
                          </label>
                          <div className="flex gap-2">
                            <Input
                              id="promoCode"
                              type="text"
                              placeholder="Enter code"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handlePromoCode}
                              disabled={!promoCode.trim()}
                              className="whitespace-nowrap"
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <p>Subtotal</p>
                        <p>${subtotal.toFixed(2)}</p>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <p>Discount</p>
                          <p>-${discount.toFixed(2)}</p>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <p>Shipping</p>
                        <p>{shipping === 0 ? "Free" : `${shipping.toFixed(2)}`}</p>
                      </div>
                      <div className="flex justify-between">
                        <p>Tax</p>
                        <p>${tax.toFixed(2)}</p>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <p>Total</p>
                        <p>${total.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="hidden lg:block">
                       <Button
                        type="submit"
                        form="checkout-form"
                        size="lg"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        disabled={isPending || !stripe}
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Complete Order - ${total.toFixed(2)}`
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggested Address Dialog */}
      <Dialog open={addressSuggestOpen} onOpenChange={setAddressSuggestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>We found a suggested address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Shippo suggested a more accurate address. You can use it or keep what you entered.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded border p-3">
                <Label className="text-xs text-muted-foreground">Entered</Label>
                <div className="mt-1 text-sm">
                  <div>{`${formData.shippingFirstName} ${formData.shippingLastName}`}</div>
                  <div>{formData.shippingAddress}</div>
                  <div>{`${formData.shippingCity}, ${formData.shippingState} ${formData.shippingZipCode}`}</div>
                  <div>US</div>
                </div>
              </div>
              <div className="rounded border p-3">
                <Label className="text-xs text-muted-foreground">Suggested</Label>
                <div className="mt-1 text-sm">
                  <div>{`${formData.shippingFirstName} ${formData.shippingLastName}`}</div>
                  <div>{addressSuggestion?.address1 || formData.shippingAddress}</div>
                  <div>{`${addressSuggestion?.city || formData.shippingCity}, ${addressSuggestion?.state || formData.shippingState} ${addressSuggestion?.postal_code || formData.shippingZipCode}`}</div>
                  <div>{addressSuggestion?.country || 'US'}</div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddressSuggestOpen(false)}>Keep Entered</Button>
            <Button onClick={applySuggestedAndContinue}>Use Suggested & Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

export default function CheckoutClientPage({ user, customer }: { user: UserType | null, customer: Customer | null }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm user={user} customer={customer} />
    </Elements>
  );
}
