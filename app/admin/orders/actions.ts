"use server";

import { createClient } from "@/lib/supabase/server";
import { Order } from "@/lib/schema";

export type OrderWithCustomer = Order & {
  customers: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  payment_status: string | null;
  order_status: string | null;
  shipping_status: string | null;
};

export async function getOrders(
  query: string,
  paymentStatus: string,
  orderStatus: string,
  shippingStatus: string
): Promise<OrderWithCustomer[]> {
  const supabase = await createClient();
  let queryBuilder = supabase
    .from("orders")
    .select("*, customers(first_name, last_name, email)")
    .order("created_at", { ascending: false });

  if (query) {
    queryBuilder = queryBuilder.or(
      `id.ilike.%${query}%,customers.first_name.ilike.%${query}%,customers.last_name.ilike.%${query}%,customers.email.ilike.%${query}%`
    );
  }

  if (paymentStatus) {
    queryBuilder = queryBuilder.eq("payment_status", paymentStatus);
  }
  if (orderStatus) {
    queryBuilder = queryBuilder.eq("order_status", orderStatus);
  }
  if (shippingStatus) {
    queryBuilder = queryBuilder.eq("shipping_status", shippingStatus);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  return data;
}

import Stripe from "stripe";

export async function getOrderById(orderId: string) {
  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      customers(*),
      line_items(*, products(name)),
      shipping_details(*)
    `)
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("Error fetching order:", error);
    return null;
  }

  if (!order) {
    return null;
  }

  let card_last4 = null;
  if (order.stripe_payment_intent_id) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-07-30.basil",
      });

      const paymentIntent = await stripe.paymentIntents.retrieve(
        order.stripe_payment_intent_id,
        { expand: ["payment_method"] }
      );

      if (
        paymentIntent.payment_method &&
        typeof paymentIntent.payment_method !== "string" &&
        paymentIntent.payment_method.card
      ) {
        card_last4 = paymentIntent.payment_method.card.last4;
      }
    } catch (stripeError) {
      console.error("Error fetching from Stripe:", stripeError);
      // Don't block the whole process if Stripe fails, just log it
    }
  }

  const rawOrder = {
    ...order,
    card_last4,
  };

  return {
    ...rawOrder,
    customers: Array.isArray(rawOrder.customers) ? rawOrder.customers[0] : rawOrder.customers,
  };
}
