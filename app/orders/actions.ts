"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(
  orderId: string,
  status: "cancelled" | "refunded"
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to update an order." };
  }

  // Verify the user owns the order they are trying to update
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, customer_id")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return { error: "Order not found." };
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!customer || order.customer_id !== customer.id) {
    return { error: "You are not authorized to update this order." };
  }

  // Update the order status
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    console.error("Error updating order status:", error);
    return { error: "Could not update order status." };
  }

  revalidatePath("/orders");

  return { success: true };
}
