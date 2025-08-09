"use client";

import React from "react";
import { Order, Customer, LineItem, Product } from "@/lib/schema";
import Logo from "@/components/Logo";

type LineItemWithProduct = LineItem & {
  products: Pick<Product, "name"> | null;
};

export type OrderDetails = Order & {
  customers: Customer | null;
  line_items: LineItemWithProduct[];
  card_last4: string | null;
};

export function PackingSlip({ order }: { order: OrderDetails }) {
  if (!order) return null;

  return (
    <div className="bg-white relative text-black  mx-auto shadow rounded-lg p-4 sm:p-8 text-[15px] font-sans">

<header className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b mb-6 gap-2">
  <div className="flex flex-col items-start">
    <Logo className="h-8 mb-1" />
    <p className="text-[10px] text-gray-500 tracking-tight uppercase">
      goods for your goods
    </p>
  </div>
  <h2 className="text-xl sm:text-3xl font-bold text-gray-900 sm:text-right">
    Packing Slip
  </h2>
</header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-6">
        <div>
          <h3 className="font-semibold text-sm mb-1 text-gray-800">Shipping Address</h3>
          <p>{order.customers?.first_name} {order.customers?.last_name}</p>
          <p>{order.billing_address_line1}</p>
          {order.billing_address_line2 && <p>{order.billing_address_line2}</p>}
          <p>
            {order.billing_city}, {order.billing_state} {order.billing_postal_code}
          </p>
          <p>{order.billing_country}</p>
        </div>
        <div>
          <h3 className="font-semibold text-sm mb-1 text-gray-800">Order Details</h3>
          <dl>
            <dt className="inline font-medium">Order ID:</dt>
            <dd className="inline ml-1">{order.id.substring(0, 8)}</dd>
            <br />
            <dt className="inline font-medium">Order Date:</dt>
            <dd className="inline ml-1">{new Date(order.created_at!).toLocaleDateString()}</dd>
            <br />
            {order.card_last4 && (
              <>
                <dt className="inline font-medium">Payment Method:</dt>
                <dd className="inline ml-1">Card ending in {order.card_last4}</dd>
              </>
            )}
          </dl>
        </div>
      </section>

      <section>
        <h3 className="font-bold mb-3 text-lg text-gray-900">Order Items</h3>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[320px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="py-2 px-2 text-xs font-semibold text-gray-700 tracking-widest text-left">SKU</th>
                <th className="py-2 px-2 text-xs font-semibold text-gray-700 tracking-widest text-left">Product</th>
                <th className="py-2 px-2 text-xs font-semibold text-gray-700 tracking-widest text-center">Qty</th>
              </tr>
            </thead>
            <tbody>
              {order.line_items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2 px-2 font-mono text-[13px] text-gray-800">ZEV-{item?.id.substring(0, 6)}</td>
                  <td className="py-2 px-2 text-gray-900">{item.products?.name}</td>
                  <td className="py-2 px-2 text-center text-gray-900">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="text-center mt-8 text-[14px] text-gray-500">
        <p>Thank you for your order!</p>
        <p className="mt-1">Questions? Email us at <span className="underline">hello@zevlinbike.com</span></p>
      </footer>
    </div>
  );
}

