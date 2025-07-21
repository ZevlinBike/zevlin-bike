"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Placeholder data for cart items
const cartItems = [
  {
    id: 1,
    name: "Zevlin Super Crack Chamois Cream",
    price: 24.99,
    quantity: 1,
    image: "/images/zevlin-super-crack-01.webp",
  },
  {
    id: 2,
    name: "Zevlin Crack Chamois Cream",
    price: 22.99,
    quantity: 2,
    image: "/images/zevlin-crack-00.webp",
  },
  {
    id: 3,
    name: "Zevlin BYOT Chamois Cream",
    price: 19.99,
    quantity: 1,
    image: "/images/zevlin-BYOT-00.webp",
  },
];

const subtotal = cartItems.reduce(
  (acc, item) => acc + item.price * item.quantity,
  0,
);
const shipping = 5.0;
const tax = subtotal * 0.08;
const total = subtotal + shipping + tax;

export default function CartPage() {
  return (
    <div className="pt-40 min-h-screen text-gray-900 bg-white dark:text-white dark:bg-neutral-900">
      <div className="container px-4 mx-auto sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Shopping Cart
        </h1>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ul
              role="list"
              className="divide-y divide-gray-200 dark:divide-gray-700"
            >
              {cartItems.map((item) => (
                <li key={item.id} className="flex py-6 bg-neutral-800 p-4">
                  <div className="overflow-hidden flex-shrink-0 w-24 h-24 rounded-md border border-gray-200 dark:border-gray-700">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={96}
                      height={96}
                      className="object-contain object-center w-full h-full"
                    />
                  </div>

                  <div className="flex flex-col flex-1 ml-4">
                    <div>
                      <div className="flex justify-between text-base font-medium">
                        <h3>
                          <Link href="#">{item.name}</Link>
                        </h3>
                        <p className="ml-4">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-1 justify-between items-end text-sm">
                      <div className="flex items-center">
                        <label
                          htmlFor={`quantity-${item.id}`}
                          className="sr-only"
                        >
                          Quantity
                        </label>
                        <Input
                          id={`quantity-${item.id}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={() => null}
                          className="w-20"
                          // onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                        />
                      </div>

                      <div className="flex">
                        <Button
                          variant="ghost"
                          type="button"
                          className="font-medium text-red-600 hover:text-red-500"
                          // onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-1">
            <div className="p-6 bg-gray-50 rounded-lg shadow-md dark:bg-neutral-800">
              <h2 className="mb-4 text-lg font-medium">Order summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <p>Subtotal</p>
                  <p>${subtotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between">
                  <p>Shipping</p>
                  <p>${shipping.toFixed(2)}</p>
                </div>
                <div className="flex justify-between">
                  <p>Tax</p>
                  <p>${tax.toFixed(2)}</p>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between text-lg font-bold">
                  <p>Total</p>
                  <p>${total.toFixed(2)}</p>
                </div>
              </div>
              <Button className="mt-6 w-full" size="lg">
                Checkout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
