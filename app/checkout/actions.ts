"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { CartItem } from "@/store/cartStore";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

const costsSchema = z.object({
  subtotal: z.number(),
  shipping: z.number(),
  tax: z.number(),
  discount: z.number(),
  total: z.number(),
});

export async function processCheckout(
  formData: unknown, 
  cartItems: CartItem[], 
  costs: unknown,
  paymentMethodId: string
) {
  console.log("Starting checkout process...");
  
  const validatedFields = checkoutFormSchema.safeParse(formData);
  const validatedCosts = costsSchema.safeParse(costs);

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }
  if (!validatedCosts.success) {
    return { errors: { _form: ["Invalid cost calculation."] } };
  }

  const { data: checkoutData } = validatedFields;
  const { data: costData } = validatedCosts;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let customerId: string;

  try {
    // Step 1: Find or Create Customer before anything else.
    if (user) {
      const { data: customer, error } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore 'not found' error
        throw error;
      }
      
      if (customer) {
        customerId = customer.id;
      } else {
        const { data: newCustomer, error: newCustomerError } = await supabase
          .from("customers")
          .insert({
            first_name: checkoutData.firstName,
            last_name: checkoutData.lastName,
            email: checkoutData.email,
            phone: checkoutData.phone,
            auth_user_id: user.id,
          })
          .select("id")
          .single();
        if (newCustomerError) throw newCustomerError;
        customerId = newCustomer!.id;
      }
    } else {
      // Guest checkout
      const { data: existingCustomer, error } = await supabase
        .from("customers")
        .select("id")
        .or(`email.eq.${checkoutData.email},phone.eq.${checkoutData.phone}`)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (existingCustomer) {
        return { errors: { _form: ["A customer with this email or phone number already exists. Please log in to continue."] } };
      } else {
        const { data: newCustomer, error: newCustomerError } = await supabase
          .from("customers")
          .insert({
            first_name: checkoutData.firstName,
            last_name: checkoutData.lastName,
            email: checkoutData.email,
            phone: checkoutData.phone,
          })
          .select("id")
          .single();
        if (newCustomerError) throw newCustomerError;
        customerId = newCustomer!.id;
      }
    }

    // Step 2: Now that we have a customer, create the Payment Intent.
    const totalInCents = Math.round(costData.total * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalInCents,
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      metadata: {
        customerId: customerId,
      }
    });

    if (paymentIntent.status !== 'succeeded') {
      return { errors: { _form: ["Payment failed. Please try another card."] } };
    }

    // Step 3: Create the order in our database.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId,
        subtotal_cents: Math.round(costData.subtotal * 100),
        shipping_cost_cents: Math.round(costData.shipping * 100),
        tax_cents: Math.round(costData.tax * 100),
        discount_cents: Math.round(costData.discount * 100),
        total_cents: totalInCents,
        stripe_payment_intent_id: paymentIntent.id,
        billing_name: `${checkoutData.firstName} ${checkoutData.lastName}`,
        billing_address_line1: checkoutData.address,
        billing_city: checkoutData.city,
        billing_state: checkoutData.state,
        billing_postal_code: checkoutData.zipCode,
        billing_country: 'US',
      })
      .select("id")
      .single();

    if (orderError) throw orderError;

    const orderId = order!.id;

    // Step 4: Create Line Items and Shipping Details
    const lineItems = cartItems.map(item => ({
      order_id: orderId,
      product_id: item.id,
      quantity: item.quantity,
      unit_price_cents: item.price_cents,
    }));
    const { error: lineItemsError } = await supabase.from("line_items").insert(lineItems);
    if (lineItemsError) throw lineItemsError;

    const { error: shippingDetailsError } = await supabase.from("shipping_details").insert({
      order_id: orderId,
      name: `${checkoutData.firstName} ${checkoutData.lastName}`,
      address_line1: checkoutData.address,
      city: checkoutData.city,
      state: checkoutData.state,
      postal_code: checkoutData.zipCode,
      country: 'US',
    });
    if (shippingDetailsError) throw shippingDetailsError;

    console.log("Checkout process complete. Order ID:", orderId);
    return { success: true, orderId: orderId };

  } catch (error: any) {
    console.error("Checkout process failed:", error);
    
    let errorMessage = "An unexpected error occurred.";
    if (error.code === '23505') { // Postgres unique violation
      if (error.message.includes('customers_phone_key')) {
        errorMessage = "This phone number is already in use. Please use a different one or log in.";
        return { errors: { phone: [errorMessage] } };
      }
      if (error.message.includes('customers_email_key')) {
        errorMessage = "This email is already in use. Please use a different one or log in.";
        return { errors: { email: [errorMessage] } };
      }
    } else if (error instanceof Stripe.errors.StripeError) {
      errorMessage = error.message;
    }
    
    return { errors: { _form: [errorMessage] } };
  }
}
