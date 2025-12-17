import type { CheckDefinition, CheckResult } from '../config/checks';

function ok(partial: Omit<CheckResult, 'status'>): CheckResult {
  return { status: 'pass', ...partial };
}
function fail(partial: Omit<CheckResult, 'status'>): CheckResult {
  return { status: 'fail', ...partial };
}
function warn(partial: Omit<CheckResult, 'status'>): CheckResult {
  return { status: 'warn', ...partial };
}
function skipped(partial: Omit<CheckResult, 'status'>): CheckResult {
  return { status: 'skipped', ...partial };
}

export const checks: CheckDefinition[] = [
  // Env
  {
    key: 'env:brevo',
    category: 'env',
    title: 'Brevo keys present',
    run: async () => {
      const okVars = Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL && process.env.BREVO_SENDER_NAME);
      return okVars
        ? ok({ key: 'env:brevo', category: 'env', title: 'Brevo keys present' })
        : fail({ key: 'env:brevo', category: 'env', title: 'Brevo keys present', summary: 'BREVO_* env vars missing' });
    },
  },
  {
    key: 'env:supabase',
    category: 'env',
    title: 'Supabase public creds present',
    run: async () => {
      const okVars = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY);
      return okVars
        ? ok({ key: 'env:supabase', category: 'env', title: 'Supabase public creds present' })
        : fail({ key: 'env:supabase', category: 'env', title: 'Supabase public creds present', summary: 'NEXT_PUBLIC_SUPABASE_* missing' });
    },
  },
  {
    key: 'env:stripe',
    category: 'env',
    title: 'Stripe keys configured (live or test)',
    run: async () => {
      const okVars = Boolean(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY);
      return okVars
        ? ok({ key: 'env:stripe', category: 'env', title: 'Stripe keys configured (live or test)' })
        : warn({ key: 'env:stripe', category: 'env', title: 'Stripe keys configured (live or test)', summary: 'Stripe secret key not set; payments disabled' });
    },
  },
  {
    key: 'env:shippo',
    category: 'env',
    title: 'Shippo token configured (live or test)',
    run: async () => {
      const okVars = Boolean(process.env.SHIPPO_API_TOKEN || process.env.SHIPPO_TEST_API_TOKEN);
      return okVars
        ? ok({ key: 'env:shippo', category: 'env', title: 'Shippo token configured (live or test)' })
        : warn({ key: 'env:shippo', category: 'env', title: 'Shippo token configured (live or test)', summary: 'SHIPPO_* token not set; shipping API disabled' });
    },
  },

  // Catalog integrity (lightweight placeholders; real checks run via Supabase server actions)
  {
    key: 'catalog:slugs',
    category: 'catalog',
    title: 'Product and category slugs are unique',
    run: async () => skipped({ key: 'catalog:slugs', category: 'catalog', title: 'Product and category slugs are unique', summary: 'Implement with Supabase query' }),
  },
  {
    key: 'catalog:images',
    category: 'catalog',
    title: 'Products have at least one image',
    run: async () => skipped({ key: 'catalog:images', category: 'catalog', title: 'Products have at least one image', summary: 'Implement with Supabase query' }),
  },

  // Checkout and orders
  {
    key: 'checkout:address-validation',
    category: 'checkout',
    title: 'Address validation endpoint available',
    run: async () => skipped({ key: 'checkout:address-validation', category: 'checkout', title: 'Address validation endpoint available', summary: 'Call /api/shipping/validate-address in server action' }),
  },
  {
    key: 'payments:pi-create',
    category: 'payments',
    title: 'Stripe PaymentIntent can be created (test key)',
    run: async () => (process.env.STRIPE_TEST_SECRET_KEY ? skipped({ key: 'payments:pi-create', category: 'payments', title: 'Stripe PaymentIntent can be created (test key)', summary: 'Implement with Stripe SDK server-side' }) : warn({ key: 'payments:pi-create', category: 'payments', title: 'Stripe PaymentIntent can be created (test key)', summary: 'No STRIPE_TEST_SECRET_KEY' })),
  },
  {
    key: 'shipping:rates',
    category: 'shipping',
    title: 'Shippo rates can be retrieved (sandbox)',
    run: async () => (process.env.SHIPPO_TEST_API_TOKEN ? skipped({ key: 'shipping:rates', category: 'shipping', title: 'Shippo rates can be retrieved (sandbox)', summary: 'Implement with lib/shippo.ts server-side' }) : warn({ key: 'shipping:rates', category: 'shipping', title: 'Shippo rates can be retrieved (sandbox)', summary: 'No SHIPPO_TEST_API_TOKEN' })),
  },
];

export default checks;

