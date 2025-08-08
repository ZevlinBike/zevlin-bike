"use server";

import { createClient } from "@/lib/supabase/server";
import { Order } from "@/lib/schema";
import { revalidatePath } from "next/cache";

export async function getOrders(
  query: string,
  status: string
): Promise<Order[]> {
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

  if (status && status !== "all") {
    queryBuilder = queryBuilder.eq("status", status);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  return data as any[];
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    console.error("Error updating order status:", error);
    return { error: "Could not update order status." };
  }

  revalidatePath("/admin/orders");
  return { success: true };
}

import Stripe from "stripe";

export async function getOrderById(orderId: string) {
  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      customers(*),
      line_items(*, products(name))
    `
    )
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
        apiVersion: "2024-06-20",
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

  return {
    ...order,
    card_last4,
  };
}
