import { createServiceClient } from '@/lib/supabase/service';
import { validateAddress } from '@/lib/shippo';
import type { HealthTest, TestResult, TestContext } from '../types';

// Helper to cap strings for details output
const trim = (s?: string | null, n = 64) => (s ? (s.length > n ? s.slice(0, n) + '…' : s) : undefined);

export const checkoutE2E: HealthTest = {
  id: 'checkout-e2e',
  name: 'Checkout end-to-end (payment bypass/sandbox)',
  category: 'checkout',
  async run(ctx?: TestContext): Promise<TestResult> {
    const log = ctx?.log ?? (() => {});
    const bypass = ctx?.bypassPayment ?? true;
    const allowNetwork = ctx?.allowNetwork ?? false;
    const svc = createServiceClient();

    const errors: string[] = [];
    const details: Record<string, unknown> = {};

    try {
      // 1) Fetch a product to purchase
      const { data: products, error: pErr } = await svc
        .from('products')
        .select('id,name,price_cents')
        .order('created_at', { ascending: true })
        .limit(1);
      if (pErr) throw pErr;
      if (!products || products.length === 0) {
        return { id: this.id, name: this.name, status: 'warn', summary: 'No products available to test', details };
      }
      const product = products[0];
      details.product = { id: product.id, name: trim(product.name), price_cents: product.price_cents };

      // 2) Prepare a customer (re-use deterministic email)
      const email = 'health-test@example.invalid';
      let customerId: string | null = null;
      {
        const { data: existing } = await svc.from('customers').select('id').eq('email', email).maybeSingle();
        if (existing?.id) {
          customerId = existing.id;
        } else {
          const { data: created, error: cErr } = await svc
            .from('customers')
            .insert({ first_name: 'Health', last_name: 'Monitor', email })
            .select('id')
            .single();
          if (cErr) throw cErr;
          customerId = created.id;
        }
      }
      details.customer_id = customerId;

      // 3) Validate address via Shippo if allowed and token present
      let addressOk: boolean | 'skipped' = 'skipped';
      const hasShippo = Boolean(process.env.SHIPPO_API_TOKEN || process.env.SHIPPO_TEST_API_TOKEN);
      const testAddress = {
        name: 'Health Monitor',
        address1: '525 Market St',
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94105',
        country: 'US',
        email,
      };
      if (allowNetwork && hasShippo) {
        try {
          const res = await validateAddress(testAddress);
          addressOk = !!res.isValid;
          details.address_valid = res.isValid;
          details.address_suggested = res.suggested ?? null;
        } catch (e) {
          addressOk = false;
          errors.push(e instanceof Error ? e.message : 'Address validation failed');
        }
      }

      // 4) Compute totals (simple): subtotal from 1 qty, tax 8%, shipping 0
      const subtotal_cents = product.price_cents;
      const discount_cents = 0;
      const tax_cents = Math.round((subtotal_cents - discount_cents) * 0.08);
      const shipping_cost_cents = 0;
      const total_cents = subtotal_cents + tax_cents + shipping_cost_cents - discount_cents;
      details.totals = { subtotal_cents, tax_cents, shipping_cost_cents, discount_cents, total_cents };

      // 5) Create order and artifacts with is_training=true. If not bypassing payment, we could set order_status accordingly.
      const orderInsert = {
        customer_id: customerId,
        status: 'paid',
        payment_status: 'paid',
        order_status: 'pending_fulfillment',
        shipping_status: 'not_shipped',
        subtotal_cents,
        shipping_cost_cents,
        tax_cents,
        discount_cents,
        total_cents,
        stripe_payment_intent_id: bypass ? null : undefined,
        billing_name: 'Health Monitor',
        billing_address_line1: testAddress.address1,
        billing_city: testAddress.city,
        billing_state: testAddress.state,
        billing_postal_code: testAddress.postal_code,
        billing_country: 'US',
        is_training: true,
      } as const;

      const { data: order, error: oErr } = await svc
        .from('orders')
        .insert(orderInsert as any)
        .select('id')
        .single();
      if (oErr) throw oErr;
      const orderId = order.id as string;
      details.order_id = orderId;

      // 6) Line item
      const { error: liErr } = await svc.from('line_items').insert({
        order_id: orderId,
        product_id: product.id,
        quantity: 1,
        unit_price_cents: product.price_cents,
      });
      if (liErr) throw liErr;

      // 7) Shipping details
      const { error: sdErr } = await svc.from('shipping_details').insert({
        order_id: orderId,
        name: 'Health Monitor',
        address_line1: testAddress.address1,
        city: testAddress.city,
        state: testAddress.state,
        postal_code: testAddress.postal_code,
        country: 'US',
      });
      if (sdErr) throw sdErr;

      // 8) Assertions: order exists, totals non-zero, and optional address result
      if (!orderId) errors.push('Order not created');
      if (total_cents <= 0) errors.push('Total <= 0');
      if (addressOk === false) errors.push('Address validation failed');

      const status: TestResult['status'] = errors.length ? 'fail' : 'pass';
      return {
        id: this.id,
        name: this.name,
        status,
        summary: status === 'pass' ? 'Order created in training mode' : 'Checkout test encountered errors',
        details,
        errors: errors.length ? errors : undefined,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { id: this.id, name: this.name, status: 'fail', summary: msg, errors: [msg] };
    }
  },
};

