"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartStore } from "@/store/cartStore";
import MainLayout from "@/components/layouts/MainLayout";
import { Loader2, CreditCard, Truck, User, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { processCheckout } from "./actions";
import { login } from "@/app/auth/login/actions";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface CheckoutForm {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export default function CheckoutClientPage({ user, customer }) {
  const router = useRouter();
  const {
    items: cartItems,
    getTotalPrice,
    clearCart,
    hydrated,
  } = useCartStore();

  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, any>>({});

  const [formData, setFormData] = useState<CheckoutForm>({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
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
          firstName: customer.first_name || '',
          lastName: customer.last_name || '',
          phone: customer.phone || '',
        }));
      } else {
        router.push('/auth/create-profile');
      }
    }
  }, [user, customer, router]);

  const subtotal = getTotalPrice();
  const shipping = subtotal >= 49 ? 0 : cartItems.length > 0 ? 5.0 : 0;
  const tax = (subtotal - discount) * 0.08;
  const total = subtotal + shipping + tax - discount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePromoCode = () => {
    const codes = {
      "SAVE10": 10,
      "WELCOME20": 20,
      "FREESHIP": shipping,
    };
    
    const upperCode = promoCode.toUpperCase();
    if (codes[upperCode as keyof typeof codes]) {
      setAppliedPromo(upperCode);
      setDiscount(codes[upperCode as keyof typeof codes]);
      setPromoCode("");
    } else {
      alert("Invalid promo code. Try SAVE10, WELCOME20, or FREESHIP");
    }
  };

  const removePromoCode = () => {
    setAppliedPromo("");
    setDiscount(0);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrors({});

    startTransition(async () => {
      const result = await login(Object.fromEntries(formData.entries()));

      if (result?.errors) {
        setErrors(result.errors);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    startTransition(async () => {
      const result = await processCheckout(formData, cartItems, total);

      if (result.errors) {
        setErrors(result.errors);
      } else if (result.success && result.orderId) {
        clearCart();
        router.push(`/order/${result.orderId}`);
      }
    });
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
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email Address
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        required
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email[0]}</p>}
                    </div>
                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium mb-2"
                      >
                        Password
                      </label>
                      <Input
                        id="password"
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
                    {errors._form && <p className="text-red-500 text-sm mt-1">{errors._form[0]}</p>}
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Don't have an account?{" "}
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
                            id="firstName"
                            name="firstName"
                            required
                            value={formData.firstName}
                            onChange={handleInputChange}
                            placeholder="John"
                          />
                          {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName[0]}</p>}
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                            Last Name *
                          </label>
                          <Input
                            id="lastName"
                            name="lastName"
                            required
                            value={formData.lastName}
                            onChange={handleInputChange}
                            placeholder="Doe"
                          />
                          {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName[0]}</p>}
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="address" className="block text-sm font-medium mb-2">
                          Street Address *
                        </label>
                        <Input
                          id="address"
                          name="address"
                          required
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="123 Main St"
                        />
                        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address[0]}</p>}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label htmlFor="city" className="block text-sm font-medium mb-2">
                            City *
                          </label>
                          <Input
                            id="city"
                            name="city"
                            required
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="New York"
                          />
                          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city[0]}</p>}
                        </div>
                        <div>
                          <label htmlFor="state" className="block text-sm font-medium mb-2">
                            State *
                          </label>
                          <Input
                            id="state"
                            name="state"
                            required
                            value={formData.state}
                            onChange={handleInputChange}
                            placeholder="NY"
                          />
                          {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state[0]}</p>}
                        </div>
                        <div>
                          <label htmlFor="zipCode" className="block text-sm font-medium mb-2">
                            ZIP Code *
                          </label>
                          <Input
                            id="zipCode"
                            name="zipCode"
                            required
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            placeholder="10001"
                          />
                          {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode[0]}</p>}
                        </div>
                      </div>
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
                      <div>
                        <label htmlFor="cardNumber" className="block text-sm font-medium mb-2">
                          Card Number *
                        </label>
                        <Input
                          id="cardNumber"
                          type="text"
                          required
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label htmlFor="expiry" className="block text-sm font-medium mb-2">
                            Expiry Date *
                          </label>
                          <Input
                            id="expiry"
                            type="text"
                            required
                            placeholder="MM/YY"
                            maxLength={5}
                          />
                        </div>
                        <div>
                          <label htmlFor="cvv" className="block text-sm font-medium mb-2">
                            CVV *
                          </label>
                          <Input
                            id="cvv"
                            type="text"
                            required
                            placeholder="123"
                            maxLength={4}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="lg:hidden">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Complete Order - $${total.toFixed(2)}`
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
                            ${(item.price * item.quantity).toFixed(2)}
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
                        <p>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</p>
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
                        disabled={isPending}
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Complete Order - $${total.toFixed(2)}`
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
    </MainLayout>
  );
}
