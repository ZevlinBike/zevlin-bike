"use server";

import { createClient } from "@/lib/supabase/server";
import { Order } from "@/lib/schema";

export type OrderWithCustomer = Order & {
  customers: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  is_training?: boolean | null;
  // For guest fallback display
  billing_name?: string | null;
  shipping_details?: { name?: string | null }[];
  payment_status: string | null;
  order_status: string | null;
  shipping_status: string | null;
};

export async function getOrders(
  query: string,
  paymentStatus: string,
  orderStatus: string,
  shippingStatus: string,
  dataset: 'real' | 'training' | 'all' = 'real'
): Promise<OrderWithCustomer[]> {
  const supabase = await createClient();
  let queryBuilder = supabase
    .from("orders")
    .select("*, customers(first_name, last_name, email), shipping_details(name)")
    .order("created_at", { ascending: false });

  if (query) {
    // Search across id, customer fields, and guest name fallbacks
    queryBuilder = queryBuilder.or(
      [
        `id.ilike.%${query}%`,
        `customers.first_name.ilike.%${query}%`,
        `customers.last_name.ilike.%${query}%`,
        `customers.email.ilike.%${query}%`,
        `billing_name.ilike.%${query}%`,
        `shipping_details.name.ilike.%${query}%`,
      ].join(',')
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

  // Dataset filter
  if (dataset === 'real') {
    queryBuilder = queryBuilder.eq('is_training', false);
  } else if (dataset === 'training') {
    queryBuilder = queryBuilder.eq('is_training', true);
  } // 'all' means no filter

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
  if (order.stripe_payment_intent_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
      // Log as a warning to avoid dev overlay while keeping diagnostics
      console.warn("Stripe lookup failed for payment intent", order.stripe_payment_intent_id, stripeError);
      // Continue without card_last4
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
