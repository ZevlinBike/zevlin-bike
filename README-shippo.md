# Shippo Shipping Integration

This app integrates Shippo for live rates, label purchase/void, and tracking in the admin dashboard.

## Required env vars

Copy `.env.local.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`: Supabase anon key
- `SHIPPO_API_TOKEN`: Shippo API key (use a test key in dev)
- `APP_URL`: Base URL for webhook targets (e.g. http://localhost:3000)
- `SHIPPO_WEBHOOK_SECRET`: Shared secret for the Shippo webhook
- `STRIPE_SECRET_KEY`: Existing Stripe secret (read-only used for admin payment details)

## Install dependencies

- `npm install`

## Database migrations

- Ensure your Supabase DB has the `pgcrypto` extension for `gen_random_uuid()`.
- Apply migrations in `db/migrations`, including `0006_shippo_shipping.sql`.

If you use the Supabase CLI:

- `supabase db reset` (dev only) or `supabase db push` to apply new migrations.

## Seeding

- Go to Admin → Settings → Packages and create a default package (e.g., 20×15×10 cm, 100 g).

## Webhook setup

- In Shippo, create a webhook pointing to `${APP_URL}/api/webhooks/shippo`.
- Add a custom header `X-Shippo-Secret: <SHIPPO_WEBHOOK_SECRET>`.

## Admin flow

- Admin → Orders → Open an order
- In the Shipping card:
  - Click Get Rates to retrieve live rates
  - Click Buy Label on a desired rate to purchase a label
  - Download the label (PDF/URL) and view tracking
  - Void Label when eligible

## Returns (basic)

- The returns label endpoint is scaffolded in TODO but not implemented in this pass.

## Notes & assumptions

- Destination address uses the order’s stored billing_* fields as a proxy for shipping. Replace with a dedicated shipping address if/when present.
- Product/variant weights are not in the current schema; rate quote and label purchase assume 200 g per item plus package weight. Update when real weights are available.
- Origin address uses a temporary constant (Zevlin Warehouse, Columbus, OH). Move this to a store settings table or env-backed config for production.
- Admin endpoints require an authenticated admin user. Middleware and role checks are in place.
- No secrets are exposed to the client. Shippo is only called server-side.

## Testing

1. Create a default package under Admin → Settings → Packages.
2. Ensure at least one paid order exists with a US address.
3. Admin → Order → Get Rates → See USPS/UPS options (as supported by your Shippo account).
4. Click Buy Label → Label URL appears; open the PDF.
5. Webhook: POST a sample event to `${APP_URL}/api/webhooks/shippo` with header `X-Shippo-Secret` set.
6. Verify the shipment status updates and appears on the order page.

## Adding carriers/services

- Shippo aggregates carriers automatically based on your account connections. No code change is required; rate response will include available carriers/services.

## Troubleshooting

- If rates fail: ensure a default package exists and the order address is valid.
- If webhook 401: verify `SHIPPO_WEBHOOK_SECRET` header and value.
- If label purchase 409: a label already exists for the order (single-package flow).

