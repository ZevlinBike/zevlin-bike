Title: E2E Testing Wizard, Manual Shipping, and Stripe Env Handling
Date: 2025-10-12

Summary
- Added an admin testing wizard at `/admin/testing` to simulate end‑to‑end checkout, payment, rate shopping, and label purchase.
- Added manual shipping support to capture external (e.g., ShipStation) shipments with tracking + customer emails via Brevo.
- Improved Stripe lookup to respect test vs live environments for training orders.

Highlights
- Admin Testing Wizard
  - Wizard flow with sticky status bar: Setup → Cart (with discount code) → Intent → Payment → Ship.
  - Validates addresses via Shippo, renders Stripe Payment Element, finalizes order, fetches rates, purchases labels.
  - Orders created from this page are flagged `is_training = true`.

- Manual Shipping & Updates
  - Record external shipments and send tracking emails to customers.
  - Endpoints:
    - POST `/api/admin/orders/[orderId]/shipments`
      - Body: `{ carrier, service?, tracking_number, tracking_url?, status?='shipped', email?=true }`
      - Inserts `shipments`, updates `orders.{order_status='fulfilled', shipping_status='shipped'}`, logs `shipment_events`, emails customer.
    - PATCH `/api/admin/shipments/[shipmentId]`
      - Body: `{ status?, tracking_url?, tracking_number?, carrier?, service?, email?=true }`
      - Updates shipment; if `status='delivered'`, sets `orders.shipping_status='delivered'` and emails customer.
  - Admin UI: `app/admin/order/[orderId]/OrderDetailClientPage.tsx` now includes a Manual Shipment form and “Mark Delivered + Email”.

- Stripe Environment Handling
  - Env: added optional `STRIPE_TEST_SECRET_KEY` in `lib/env.ts`.
  - Order detail lookup tries keys by context:
    - Training orders: test key first, then live if resource missing.
    - Real orders: live key first, then test if resource missing.

Configuration
- Environment
  - `STRIPE_SECRET_KEY` (live) — required for real orders.
  - `STRIPE_TEST_SECRET_KEY` (test) — optional but recommended for training/test PIs.
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key for Payment Element.
  - `SHIPPO_API_TOKEN` — Shippo API token.
  - Brevo: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`.
- No database migrations required (uses existing `orders`, `shipments`, `shipment_events`, `discounts`).

Usage
- Testing Wizard (`/admin/testing`)
  1) Enter contact + address, Validate (Shippo).
  2) Add products; optionally apply a discount code.
  3) Create Payment Intent and pay (Stripe test card `4242 4242 4242 4242`).
  4) Finalize Order (creates order with `is_training=true`).
  5) Get Rates, select a rate, Buy Label (Shippo).

- Manual Shipments (Admin order detail)
  - Create manual shipment: enter carrier/service/tracking/URL → Save & Email Customer.
  - Mark Delivered + Email on non‑label shipments.

Security & Access
- All admin endpoints enforce admin role via Supabase auth and `get_user_roles` RPC.

Files Touched (key)
- New UI: `app/admin/testing/page.tsx`
- Admin nav: `app/admin/layout.tsx`
- Manual shipping APIs:
  - `app/api/admin/orders/[orderId]/shipments/route.ts` (GET, POST)
  - `app/api/admin/shipments/[shipmentId]/route.ts` (PATCH)
- Order detail UI updates: `app/admin/order/[orderId]/OrderDetailClientPage.tsx`
- Stripe lookup fallback: `app/admin/orders/actions.ts`
- Env schema: `lib/env.ts`

Notes & TODOs
- The testing wizard creates PaymentIntents using the default Stripe secret key. If you prefer all wizard runs to use the test key, we can add a test‑mode toggle and route creation accordingly.
- Consider adding a “Resend Tracking Email” button and automatic carrier tracking URL generation if only the carrier + tracking number are provided.

