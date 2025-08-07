"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { CartItem } from "@/store/cartStore";

const checkoutFormSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  phone: z.string().optional(),
});

export async function processCheckout(formData: unknown, cartItems: CartItem[], total: number) {
  console.log("Starting checkout process...");
  const validatedFields = checkoutFormSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.log("Validation failed:", validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  console.log("Validation successful. Creating Supabase client...");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let customerId;

  if (user) {
    console.log("User is authenticated. Checking for existing customer...");
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (customer) {
      console.log("Existing customer found:", customer.id);
      customerId = customer.id;
    } else {
      console.log("No existing customer found. Creating new customer...");
      const { data: newCustomer, error: newCustomerError } = await supabase
        .from("customers")
        .insert({
          first_name: validatedFields.data.firstName,
          last_name: validatedFields.data.lastName,
          email: validatedFields.data.email,
          phone: validatedFields.data.phone,
          auth_user_id: user.id,
        })
        .select("id")
        .single();

      if (newCustomerError) {
        console.error("Error creating customer:", newCustomerError);
        return { errors: { _form: ["Could not create customer."] } };
      }
      console.log("New customer created:", newCustomer.id);
      customerId = newCustomer.id;
    }
  } else {
    console.log("User is not authenticated. Creating new customer...");
    const { data: newCustomer, error: newCustomerError } = await supabase
      .from("customers")
      .insert({
        first_name: validatedFields.data.firstName,
        last_name: validatedFields.data.lastName,
        email: validatedFields.data.email,
        phone: validatedFields.data.phone,
      })
      .select("id")
      .single();

    if (newCustomerError) {
      console.error("Error creating customer:", newCustomerError);
      return { errors: { _form: ["Could not create customer."] } };
    }
    console.log("New customer created:", newCustomer.id);
    customerId = newCustomer.id;
  }

  console.log("Creating order...");
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: customerId,
      total_cents: Math.round(total * 100),
    })
    .select("id")
    .single();

  if (orderError) {
    console.error("Error creating order:", orderError);
    return { errors: { _form: ["Could not create order."] } };
  }

  console.log("Order created:", order.id);
  console.log("Adding line items...");

  const lineItems = cartItems.map(item => ({
    order_id: order.id,
    product_id: item.id,
    quantity: item.quantity,
    unit_price_cents: item.price * 100,
  }));

  const { error: lineItemsError } = await supabase.from("line_items").insert(lineItems);

  if (lineItemsError) {
    console.error("Error adding line items:", lineItemsError);
    return { errors: { _form: ["Could not save order details."] } };
  }

  console.log("Line items added successfully.");
  console.log("Checkout process complete.");

  return {
    success: true,
    orderId: order.id,
  };
}
