"use server";

import { env } from "@/lib/env";
import { sendTransactionalEmail } from "@/lib/brevo";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { validateAddress } from "@/lib/shippo";
import { CartItem } from "@/store/cartStore";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Build compact metadata payload for Stripe (values must be strings/numbers/null, <=500 chars)
type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

function buildPaymentMetadata(params: {
  customerId: string;
  authUserId?: string | null;
  checkoutData?: Partial<CheckoutFormData>;
  cartItems?: CartItem[];
  costs?: { subtotal: number; shipping: number; tax: number; discount: number; total: number };
}): Stripe.MetadataParam {
  const { customerId, authUserId, checkoutData, cartItems, costs } = params;
  const safeStr = (v: unknown) => {
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    return s.length > 500 ? s.slice(0, 500) : s;
  };

  // Compact representations to reduce size
  const cartCompact = cartItems
    ? cartItems.map((i) => [i.id, i.quantity])
    : undefined; // [[productId, qty], ...]

  const totalsCompact = costs
    ? { s: costs.subtotal, sh: costs.shipping, t: costs.tax, d: costs.discount, tot: costs.total }
    : undefined; // abbreviations to save space

  const shipping = checkoutData
    ? {
        n: `${checkoutData.shippingFirstName} ${checkoutData.shippingLastName}`.trim(),
        c: checkoutData.shippingCity,
        st: checkoutData.shippingState,
        z: checkoutData.shippingZipCode,
      }
    : undefined;

  const meta: Record<string, string | number | null> = {
    customer_id: safeStr(customerId ?? ''),
    auth_user_id: safeStr(authUserId ?? 'guest'),
    source: 'checkout',
    ver: 'v1',
  };
  if (checkoutData?.email) meta.email = safeStr(checkoutData.email);
  if (checkoutData?.phone) meta.phone = safeStr(checkoutData.phone);
  if (shipping) meta.shipping = safeStr(shipping);
  if (cartCompact) meta.cart = safeStr(cartCompact);
  if (totalsCompact) meta.totals = safeStr(totalsCompact);
  return meta;
}

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
  paymentMethodId: string,
  idempotencyKey?: string
) {
  // Starting checkout process
  
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
  const service = !user && process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : null;

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
      const { data: customer, error } = await (service ?? supabase)
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
        const { data: newCustomer, error: newCustomerError } = await (service ?? supabase)
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
      // Guest checkout: do NOT insert into customers to satisfy RLS; reuse existing or proceed as guest
      const { data: existingCustomer, error } = await (service ?? supabase)
        .from("customers")
        .select("id")
        .or(`email.eq.${checkoutData.email},phone.eq.${checkoutData.phone}`)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      customerId = existingCustomer?.id ?? undefined as unknown as string; // leave undefined if no existing
    }

    // Step 2: Now that we have a customer, create the Payment Intent.
    const totalInCents = Math.round(costData.total * 100);
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: totalInCents,
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        metadata: buildPaymentMetadata({
          customerId,
          authUserId: user?.id ?? null,
          checkoutData,
          cartItems,
          costs: costData,
        }),
      },
      // Prevent duplicate charges if client retries or double-submits
      idempotencyKey ? { idempotencyKey } : undefined
    );

    if (paymentIntent.status !== 'succeeded') {
      return { errors: { _form: ["Payment failed. Please try another card."] } };
    }

    // Step 3: Create the order in our database.
    const { data: order, error: orderError } = await (service ?? supabase)
      .from("orders")
      .insert({
        customer_id: customerId || null,
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

    // If unique constraint hit due to idempotent retry, fetch and return the existing order
    if (orderError) {
      const isUniqueViolation = orderError.code === '23505' ||
        (typeof orderError.message === 'string' && orderError.message.includes('stripe_payment_intent_id'));
      if (isUniqueViolation) {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single();
        if (existingOrder?.id) {
          return { success: true, orderId: existingOrder.id };
        }
      }
      throw orderError;
    }

    const orderId = order!.id;

    // Step 4: Create Line Items and Shipping Details
    const lineItems = cartItems.map(item => ({
      order_id: orderId,
      product_id: item.id,
      quantity: item.quantity,
      unit_price_cents: item.price_cents,
    }));
    const { error: lineItemsError } = await (service ?? supabase).from("line_items").insert(lineItems);
    if (lineItemsError) throw lineItemsError;

    const { error: shippingDetailsError } = await (service ?? supabase).from("shipping_details").insert({
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

    // Step 6: Send emails
    try {
      // 6a: Send order confirmation to customer
      const customerEmailHtml = `
        <h1>Thank you for your order!</h1>
        <p>Your order ID is ${orderId}.</p>
        <p>We'll notify you when your order ships.</p>
        <h2>Order Summary</h2>
        <ul>
          ${cartItems.map(item => `<li>${item.name} (x${item.quantity}) - ${(item.price_cents / 100).toFixed(2)}</li>`).join('')}
        </ul>
        <h3>Subtotal: ${(costData.subtotal).toFixed(2)}</h3>
        <h3>Shipping: ${(costData.shipping).toFixed(2)}</h3>
        <h3>Tax: ${(costData.tax).toFixed(2)}</h3>
        <h3>Total: ${(costData.total).toFixed(2)}</h3>
      `;
      await sendTransactionalEmail(
        { email: checkoutData.email, name: `${checkoutData.shippingFirstName} ${checkoutData.shippingLastName}` },
        `Your Zevlin Bike Order #${orderId} is Confirmed`,
        customerEmailHtml
      );

      // 6b: Send new order notification to admins
      // First, get the role ID for 'admin'
      const { data: adminRole, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'admin')
        .single();

      if (roleError || !adminRole) {
        console.error("Error fetching admin role:", roleError);
      } else {
        // Then, get all customer IDs with that role
        const { data: adminUserIds, error: userRolesError } = await supabase
          .from('user_roles')
          .select('customer_id')
          .eq('role_id', adminRole.id);

        if (userRolesError) {
          console.error("Error fetching admin user IDs:", userRolesError);
        } else if (adminUserIds && adminUserIds.length > 0) {
          const adminIds = adminUserIds.map(item => item.customer_id);
          
          // Finally, get the email addresses for those customer IDs
          const { data: adminUsers, error: adminError } = await supabase
            .from('customers')
            .select('email, first_name, last_name')
            .in('id', adminIds);

          if (adminError) {
            console.error("Error fetching admin users:", adminError);
          } else if (adminUsers) {
            const adminEmailHtml = `
              <h1>New Order Received</h1>
              <p>Order ID: ${orderId}</p>
              <p>Customer: ${checkoutData.shippingFirstName} ${checkoutData.shippingLastName} (${checkoutData.email})</p>
              <p>Total: ${(costData.total).toFixed(2)}</p>
              <p><a href="${env.APP_URL}/admin/order/${orderId}">View Order Details</a></p>
            `;
            for (const admin of adminUsers) {
              if (admin.email) {
                await sendTransactionalEmail(
                  { email: admin.email, name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() },
                  `New Order #${orderId}`,
                  adminEmailHtml
                );
              }
            }
          }
        }
      }
    } catch (emailError) {
      console.error(`Failed to send emails for order ${orderId}:`, emailError);
      // Do not block the checkout process if emails fail
    }

    // Checkout process complete
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

// Create a PaymentIntent for Stripe Payment Element (no immediate confirmation)
export async function createPaymentIntent(
  costs: unknown,
  idempotencyKey?: string,
) {
  'use server';

  const validatedCosts = costsSchema.safeParse(costs);
  if (!validatedCosts.success) {
    return { error: 'Invalid cost calculation.' };
  }
  const { data: costData } = validatedCosts;

  try {
    const totalInCents = Math.round(costData.total * 100);
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: totalInCents,
        currency: 'usd',
        // Use automatic payment methods so wallets (Apple/Google Pay) can appear in Payment Element.
        // If you don't want other redirect methods, disable them in the Stripe Dashboard for your account.
        automatic_payment_methods: { enabled: true },
        // Minimal metadata at init; full snapshot added later via upsert/finalize
        metadata: {
          source: 'checkout',
          flow: 'payment_element',
          ver: 'v1',
        },
      },
      idempotencyKey ? { idempotencyKey } : undefined,
    );

    return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
  } catch (e) {
    console.error('Failed to create PaymentIntent:', e);
    return { error: 'Failed to initialize payment. Please try again.' };
  }
}

// Finalize the order after PaymentIntent succeeded via Payment Element
export async function finalizeOrder(
  paymentIntentId: string,
  formData: unknown,
  cartItems: CartItem[],
  costs: unknown,
  options?: { isTraining?: boolean },
) {
  'use server';

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

  try {
    // Ensure the PaymentIntent is confirmed. Some wallets (e.g., Link, Amazon Pay)
    // return with a `processing` status before transitioning to `succeeded` via webhook.
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    const isSucceeded = pi.status === 'succeeded';
    const isProcessing = pi.status === 'processing' || pi.status === 'requires_capture';
    if (!isSucceeded && !isProcessing) {
      return { errors: { _form: ["Payment is not completed yet. If you used a wallet, it may still be processing."] } };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const service = !user && process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : null;

    // Find or create customer, similar to processCheckout
    let customerId: string;
    if (user) {
      const { data: customer, error } = await (service ?? supabase)
        .from("customers")
        .select("id, first_name, last_name")
        .eq("auth_user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (customer) {
        customerId = customer.id;
      } else {
        const { data: newCustomer, error: newCustomerError } = await (service ?? supabase)
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
      const { data: existingCustomer, error } = await (service ?? supabase)
        .from("customers")
        .select("id")
        .or(`email.eq.${checkoutData.email},phone.eq.${checkoutData.phone}`)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      customerId = existingCustomer?.id ?? undefined as unknown as string;
    }

    // Update PI metadata with final snapshot
    try {
      await stripe.paymentIntents.update(paymentIntentId, {
        metadata: buildPaymentMetadata({
          customerId: customerId!,
          authUserId: user?.id ?? null,
          checkoutData,
          cartItems,
          costs: costData,
        }),
      });
    } catch (metaErr) {
      console.error('Failed to update PaymentIntent metadata:', metaErr);
    }

    // Create the order, same as processCheckout but without creating a new PI
    const totalInCents = Math.round(costData.total * 100);
    const { data: order, error: orderError } = await (service ?? supabase)
      .from("orders")
      .insert({
        customer_id: customerId || null,
        // If still processing, mark payment/order as pending and advance via webhook later
        status: isSucceeded ? 'paid' : 'pending',
        payment_status: isSucceeded ? 'paid' : 'pending',
        order_status: isSucceeded ? 'pending_fulfillment' : 'pending_payment',
        shipping_status: 'not_shipped',
        subtotal_cents: Math.round(costData.subtotal * 100),
        shipping_cost_cents: Math.round(costData.shipping * 100),
        tax_cents: Math.round(costData.tax * 100),
        discount_cents: Math.round(costData.discount * 100),
        total_cents: totalInCents,
        stripe_payment_intent_id: paymentIntentId,
        is_training: options?.isTraining ?? false,
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

    if (orderError) {
      const isUniqueViolation = orderError.code === '23505' ||
        (typeof orderError.message === 'string' && orderError.message.includes('stripe_payment_intent_id'));
      if (isUniqueViolation) {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .single();
        if (existingOrder?.id) {
          return { success: true, orderId: existingOrder.id };
        }
      }
      throw orderError;
    }

    const orderId = order!.id;

    const lineItems = cartItems.map(item => ({
      order_id: orderId,
      product_id: item.id,
      quantity: item.quantity,
      unit_price_cents: item.price_cents,
    }));
    const { error: lineItemsError } = await (service ?? supabase).from("line_items").insert(lineItems);
    if (lineItemsError) throw lineItemsError;

    const { error: shippingDetailsError } = await (service ?? supabase).from("shipping_details").insert({
      order_id: orderId,
      name: `${checkoutData.shippingFirstName} ${checkoutData.shippingLastName}`,
      address_line1: checkoutData.shippingAddress,
      city: checkoutData.shippingCity,
      state: checkoutData.shippingState,
      postal_code: checkoutData.shippingZipCode,
      country: 'US',
    });
    if (shippingDetailsError) throw shippingDetailsError;

    // Decrement stock (best-effort). Only when payment has fully succeeded.
    if (isSucceeded) {
      const { error: decrementError } = await supabase.rpc('decrement_stock', { order_id_param: orderId });
      if (decrementError) {
        console.error(`Failed to decrement stock for order ${orderId}:`, decrementError);
      }
    }

    // Emails (best-effort)
    try {
      const customerEmailHtml = `
        <h1>Thank you for your order!</h1>
        <p>Your order ID is ${orderId}.</p>
        <p>${isSucceeded ? "We'll notify you when your order ships." : "We received your order and are confirming your payment. You'll get an email once it's complete."}</p>
      `;
      await sendTransactionalEmail(
        { email: checkoutData.email, name: `${checkoutData.shippingFirstName} ${checkoutData.shippingLastName}` },
        isSucceeded ? `Your Zevlin Bike Order #${orderId} is Confirmed` : `We’re processing your Order #${orderId}`,
        customerEmailHtml
      );
    } catch (emailError) {
      console.error(`Failed to send emails for order ${orderId}:`, emailError);
    }

    // Archive customer's cart (best-effort)
    try { await archiveCartForOrder(orderId); } catch {}

    return { success: true, orderId };
  } catch (error: unknown) {
    console.error('Finalize order failed:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error instanceof Stripe.errors.StripeError) {
      errorMessage = error.message;
    }
    return { errors: { _form: [errorMessage] } };
  }
}

// Upsert a pending order snapshot tied to a PaymentIntent, before confirmation
export async function upsertPendingOrder(
  paymentIntentId: string,
  formData: unknown,
  cartItems: CartItem[],
  costs: unknown,
) {
  'use server';

  const validatedFields = checkoutFormSchema.safeParse(formData);
  const validatedCosts = costsSchema.safeParse(costs);
  if (!validatedFields.success || !validatedCosts.success) {
    return { error: 'Invalid order data.' };
  }
  const { data: checkoutData } = validatedFields;
  const { data: costData } = validatedCosts;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const service = !user && process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : null;

    // Find or create customer
    let customerId: string;
    if (user) {
      const { data: customer, error } = await (service ?? supabase)
        .from('customers')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (customer) {
        customerId = customer.id;
      } else {
        const { data: newCustomer, error: newCustomerError } = await (service ?? supabase)
          .from('customers')
          .insert({
            first_name: checkoutData.shippingFirstName,
            last_name: checkoutData.shippingLastName,
            email: checkoutData.email,
            phone: checkoutData.phone,
            auth_user_id: user?.id,
          })
          .select('id')
          .single();
        if (newCustomerError) throw newCustomerError;
        customerId = newCustomer!.id;
      }
    } else {
      // Guest snapshot: don't insert into customers; use existing if found
      const { data: existingCustomer, error } = await (service ?? supabase)
        .from('customers')
        .select('id')
        .or(`email.eq.${checkoutData.email},phone.eq.${checkoutData.phone}`)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      customerId = existingCustomer?.id ?? undefined as unknown as string;
    }

    const totalInCents = Math.round(costData.total * 100);

    // Attach or refresh PI metadata snapshot (best-effort)
    try {
      await stripe.paymentIntents.update(paymentIntentId, {
        metadata: buildPaymentMetadata({
          customerId,
          authUserId: user?.id ?? null,
          checkoutData,
          cartItems,
          costs: costData,
        }),
      });
    } catch (metaErr) {
      console.error('Failed to upsert PaymentIntent metadata:', metaErr);
    }
    // Upsert order shell
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle();

    let orderId: string;
    if (existing?.id) {
      orderId = existing.id;
      await supabase
        .from('orders')
        .update({
          customer_id: customerId || null,
          status: 'pending',
          payment_status: 'pending',
          order_status: 'pending_payment',
          shipping_status: 'not_shipped',
          subtotal_cents: Math.round(costData.subtotal * 100),
          shipping_cost_cents: Math.round(costData.shipping * 100),
          tax_cents: Math.round(costData.tax * 100),
          discount_cents: Math.round(costData.discount * 100),
          total_cents: totalInCents,
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
        .eq('id', orderId);
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from('orders')
        .insert({
          customer_id: customerId || null,
          status: 'pending',
          payment_status: 'pending',
          order_status: 'pending_payment',
          shipping_status: 'not_shipped',
          subtotal_cents: Math.round(costData.subtotal * 100),
          shipping_cost_cents: Math.round(costData.shipping * 100),
          tax_cents: Math.round(costData.tax * 100),
          discount_cents: Math.round(costData.discount * 100),
          total_cents: totalInCents,
          stripe_payment_intent_id: paymentIntentId,
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
        .select('id')
        .single();
      if (insErr) throw insErr;
      orderId = inserted!.id;
    }

    // Replace line items snapshot
    await (service ?? supabase).from('line_items').delete().eq('order_id', orderId);
    const lineItems = cartItems.map((item) => ({
      order_id: orderId,
      product_id: item.id,
      quantity: item.quantity,
      unit_price_cents: item.price_cents,
    }));
    if (lineItems.length) {
      await (service ?? supabase).from('line_items').insert(lineItems);
    }

    // Upsert shipping details
    await (service ?? supabase).from('shipping_details').delete().eq('order_id', orderId);
    await (service ?? supabase).from('shipping_details').insert({
      order_id: orderId,
      name: `${checkoutData.shippingFirstName} ${checkoutData.shippingLastName}`,
      address_line1: checkoutData.shippingAddress,
      city: checkoutData.shippingCity,
      state: checkoutData.shippingState,
      postal_code: checkoutData.shippingZipCode,
      country: 'US',
    });

    return { ok: true, orderId };
  } catch (e) {
    console.error('upsertPendingOrder failed:', e);
    return { error: 'Failed to snapshot order.' };
  }
}

// Persist the authenticated user's cart server-side for traceability
export async function upsertAuthCart(cartItems: CartItem[]) {
  'use server';
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { skipped: true };
    const { data: customer, error } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
    if (error || !customer) return { skipped: true };

    // Create or fetch a single cart for the customer
    const { data: existing } = await supabase
      .from('carts')
      .select('id')
      .eq('customer_id', customer.id)
      .maybeSingle();

    let cartId: string;
    if (existing?.id) {
      cartId = existing.id;
      await supabase.from('carts').update({}).eq('id', cartId); // touch updated_at
      await supabase.from('cart_items').delete().eq('cart_id', cartId);
    } else {
      const { data: created, error: cErr } = await supabase
        .from('carts')
        .insert({ customer_id: customer.id })
        .select('id')
        .single();
      if (cErr) throw cErr;
      cartId = created!.id;
    }

    const rows = cartItems.map((ci) => ({
      cart_id: cartId,
      product_id: ci.id,
      quantity: ci.quantity,
      unit_price_cents: ci.price_cents,
    }));
    if (rows.length) {
      await supabase.from('cart_items').insert(rows);
    }
    return { ok: true, cartId };
  } catch (e) {
    console.error('upsertAuthCart failed:', e);
    return { error: 'Failed to persist cart.' };
  }
}

// Archive and clear a customer's cart when an order is placed
export async function archiveCartForOrder(orderId: string) {
  'use server';
  try {
    const supabase = await createClient();
    // Find order and customer
    const { data: order } = await supabase
      .from('orders')
      .select('id, customer_id')
      .eq('id', orderId)
      .maybeSingle();
    if (!order?.customer_id) return { skipped: true };

    // Find carts for this customer
    const { data: carts } = await supabase
      .from('carts')
      .select('id')
      .eq('customer_id', order.customer_id)
      .eq('status', 'active');
    const cartIds = (carts || []).map((c) => c.id);
    if (cartIds.length === 0) return { skipped: true };

    // Delete items and mark carts archived/converted
    await supabase.from('cart_items').delete().in('cart_id', cartIds);
    await supabase
      .from('carts')
      .update({ status: 'converted', order_id: orderId, archived_at: new Date().toISOString() })
      .in('id', cartIds);

    return { ok: true };
  } catch (e) {
    console.error('archiveCartForOrder failed:', e);
    return { error: 'Failed to archive cart.' };
  }
}

export async function verifyDiscountCode(code: string) {
  'use server';

  const supabase = await createClient();
  // Normalize the input code: trim, remove spaces, and lowercase
  const normalizedInput = code.trim().replace(/\s+/g, '').toLowerCase();

  // Fetch discounts and match in JS to support space-insensitive and case-insensitive codes
  const { data: allDiscounts, error } = await supabase
    .from('discounts')
    .select('*');

  if (error || !allDiscounts) {
    return { error: 'Invalid discount code.' };
  }

  const match = allDiscounts.find((d) =>
    typeof d.code === 'string' && d.code.trim().replace(/\s+/g, '').toLowerCase() === normalizedInput
  );

  if (!match) {
    return { error: 'Invalid discount code.' };
  }

  if (!match.active) {
    return { error: 'This discount code is no longer active.' };
  }

  return { data: match };
}
