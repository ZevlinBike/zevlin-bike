"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { validateAddress } from "@/lib/shippo";
import { CartItem } from "@/store/cartStore";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const checkoutFormSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),

  // Shipping address (required)
  shippingFirstName: z.string().min(1),
  shippingLastName: z.string().min(1),
  shippingAddress: z.string().min(1),
  shippingCity: z.string().min(1),
  shippingState: z.string().min(1),
  shippingZipCode: z.string().min(1),

  // Billing address
  billingSameAsShipping: z.coerce.boolean().default(true),
  billingFirstName: z.string().optional(),
  billingLastName: z.string().optional(),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZipCode: z.string().optional(),
}).refine((data) => {
  if (data.billingSameAsShipping) return true;
  return (
    !!data.billingFirstName &&
    !!data.billingLastName &&
    !!data.billingAddress &&
    !!data.billingCity &&
    !!data.billingState &&
    !!data.billingZipCode
  );
}, { message: "Billing address is required when not same as shipping", path: ["billingSameAsShipping"] });

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

  // Validate shipping address via Shippo before charging
  const validation = await validateAddress({
    name: `${checkoutData.shippingFirstName} ${checkoutData.shippingLastName}`,
    address1: checkoutData.shippingAddress,
    city: checkoutData.shippingCity,
    state: checkoutData.shippingState,
    postal_code: checkoutData.shippingZipCode,
    country: 'US',
  });
  if (!validation.isValid) {
    return {
      errors: {
        _form: [
          validation.messages?.[0] ||
            "The shipping address appears invalid. Please review and try again.",
        ],
      },
    };
  }

  try {
    // Step 1: Find or Create Customer before anything else.
    if (user) {
      const { data: customer, error } = await supabase
        .from("customers")
        .select("id, first_name, last_name")
        .eq("auth_user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore 'not found' error
        throw error;
      }
      
      if (customer) {
        customerId = customer.id;
        // If the customer exists, we can assume their name is already correct
        // and don't need to update it. We'll use the shipping name for the
        // shipping details only.
      } else {
        const { data: newCustomer, error: newCustomerError } = await supabase
          .from("customers")
          .insert({
            first_name: checkoutData.shippingFirstName,
            last_name: checkoutData.shippingLastName,
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
            first_name: checkoutData.shippingFirstName,
            last_name: checkoutData.shippingLastName,
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
        status: 'paid',
        payment_status: 'paid',
        order_status: 'pending_fulfillment',
        shipping_status: 'not_shipped',
        subtotal_cents: Math.round(costData.subtotal * 100),
        shipping_cost_cents: Math.round(costData.shipping * 100),
        tax_cents: Math.round(costData.tax * 100),
        discount_cents: Math.round(costData.discount * 100),
        total_cents: totalInCents,
        stripe_payment_intent_id: paymentIntent.id,
        billing_name: `${
          checkoutData.billingSameAsShipping
            ? checkoutData.shippingFirstName + ' ' + checkoutData.shippingLastName
            : `${checkoutData.billingFirstName} ${checkoutData.billingLastName}`
        }`,
        billing_address_line1: checkoutData.billingSameAsShipping
          ? checkoutData.shippingAddress
          : checkoutData.billingAddress!,
        billing_city: checkoutData.billingSameAsShipping
          ? checkoutData.shippingCity
          : checkoutData.billingCity!,
        billing_state: checkoutData.billingSameAsShipping
          ? checkoutData.shippingState
          : checkoutData.billingState!,
        billing_postal_code: checkoutData.billingSameAsShipping
          ? checkoutData.shippingZipCode
          : checkoutData.billingZipCode!,
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
      name: `${checkoutData.shippingFirstName} ${checkoutData.shippingLastName}`,
      address_line1: checkoutData.shippingAddress,
      address_line2: null,
      city: checkoutData.shippingCity,
      state: checkoutData.shippingState,
      postal_code: checkoutData.shippingZipCode,
      country: 'US',
    });
    if (shippingDetailsError) throw shippingDetailsError;

    // Step 5: Decrement stock
    const { error: decrementError } = await supabase.rpc('decrement_stock', { order_id_param: orderId });
    if (decrementError) {
      // If this fails, we should probably have a system to flag this order for manual review.
      // For now, we'll just log the error.
      console.error(`Failed to decrement stock for order ${orderId}:`, decrementError);
    }

    console.log("Checkout process complete. Order ID:", orderId);
    return { success: true, orderId: orderId };

  } catch (error: unknown) {
    console.error("Checkout process failed:", error);
    
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Stripe.errors.StripeError) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
      const code = (error as { code: unknown }).code;
      const message = (error as { message: unknown }).message;
      if (code === '23505' && typeof message === 'string') { // Postgres unique violation
        if (message.includes('customers_phone_key')) {
          errorMessage = "This phone number is already in use. Please use a different one or log in.";
          return { errors: { phone: [errorMessage] } };
        }
        if (message.includes('customers_email_key')) {
          errorMessage = "This email is already in use. Please use a different one or log in.";
          return { errors: { email: [errorMessage] } };
        }
      }
    }
    
    return { errors: { _form: [errorMessage] } };
  }
}
