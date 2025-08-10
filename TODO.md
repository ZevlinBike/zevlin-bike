You are updating a Next.js + Supabase + Stripe e-commerce app to integrate Shippo as the shipping engine, replacing ShipStation. Branch is shippo. Do ALL of the following with production-grade TypeScript, clear comments, and small PR-sized commits.

Tech constraints
Next.js (app router), TypeScript, edge-safe where possible but server code for API calls.

Supabase (SQL migrations + typed RPC where helpful).

Stripe (already used for checkout; do not change Stripe except to read order data).

Shippo via Node SDK (server-side only; DO NOT expose secrets client-side).

Keep secrets in env vars and validate with Zod.

Add minimal admin UI in the existing dashboard to create/void labels and view tracking.

ENV + setup
Add required env vars to .env.local.example with comments:

SHIPPO_API_TOKEN=

APP_URL= (for webhook targets)

Create a small lib/env.ts that validates required envs via Zod and exports a typed config.

Add shippo npm package; ensure types are correct (declare module if needed).

Database (Supabase) — migrations
Create a migration that adds the following tables (snake_case). Use sensible defaults, FKs, and indexes.

shipping_packages (preset boxes):

id uuid pk default gen_random_uuid()

name text not null

length_cm numeric not null

width_cm numeric not null

height_cm numeric not null

weight_g integer not null default 0 (empty packaging weight)

is_default boolean not null default false

unique index on name

shipments:

id uuid pk

order_id uuid not null references orders(id) on delete cascade

carrier text (e.g., "usps")

service text (e.g., "priority")

tracking_number text

tracking_url text

label_url text

rate_object_id text (Shippo rate id)

label_object_id text (Shippo transaction id)

price_amount_cents integer

price_currency text default 'USD'

status text not null default 'pending' -- pending|purchased|voided|error|delivered

to_name text, to_phone text, to_email text, to_address1 text, to_address2 text, to_city text, to_state text, to_postal_code text, to_country text

from_name text, from_phone text, from_email text, from_address1 text, from_address2 text, from_city text, from_state text, from_postal_code text, from_country text

package_name text (FK by name to shipping_packages for quick denorm; not strict)

weight_g integer not null

length_cm numeric not null, width_cm numeric not null, height_cm numeric not null

timestamps

indexes: order_id, tracking_number, status

shipment_events:

id uuid pk default gen_random_uuid()

shipment_id uuid not null references shipments(id) on delete cascade

event_code text (e.g., SHIPMENT_CREATED, TRACKING_UPDATE)

description text

raw jsonb

occurred_at timestamptz not null default now()

index on shipment_id, occurred_at desc

Also add a view or function to fetch an order with its shipments & items for admin display.

Server-side Shippo client
Create lib/shippo.ts:

Instantiate the Shippo client using SHIPPO_API_TOKEN.

Export helper fns:

getRates({to, from, parcel})

purchaseLabel({rateId})

voidLabel({transactionId})

track({carrier, tracking_number}) (wrapper if needed)

Strong types for inputs/outputs. Normalize errors.

Rate quoting API
Create /app/api/shipping/rates/route.ts (POST):

Input: { orderId: string } or { cartId: string } — prefer orderId (already placed) for admin; also allow cart use if needed.

Load order + items from Supabase. Compute:

destination (customer shipping address stored on order),

origin (store address: read from server config or a store_settings table if it exists; otherwise temp constants),

parcel dimensions/weight:

If any line items have a package_name or the order has a selected package_name, use that preset.

Else sum item weights and choose is_default package.

Call getRates to fetch live rates. Return normalized list:

typescript
Copy
Edit
type RateOption = {
  rateObjectId: string;
  carrier: string;
  service: string;
  amountCents: number;
  currency: string;
  estimatedDays?: number;
}
Never expose secrets. Cache for a minute if needed.

Label purchase API
Create /app/api/shipping/labels/route.ts (POST):

Input:

csharp
Copy
Edit
{
  orderId: string;
  rateObjectId: string;
  packageName?: string;
}
Validate order state; ensure no existing purchased label unless you support multi-package.

Purchase via purchaseLabel.

Persist a shipments row with the transaction/label/price/tracking fields.

Respond with {labelUrl, trackingNumber, trackingUrl, carrier, service}.

Label void API
Create /app/api/shipping/labels/void/route.ts (POST):

Input: { shipmentId: string }

If shipment status = purchased, call voidLabel with label_object_id, update status to voided.

Shippo webhook
Create /app/api/webhooks/shippo/route.ts:

Verify any required auth mechanism (if Shippo supports simple secret header, validate it).

Accept tracking and transaction events; upsert into shipment_events.

On tracking status = delivered, set shipments.status = 'delivered'.

On label purchase success/failure, set status accordingly.

Idempotency: dedupe by Shippo event id in a small webhook_events table.

Admin UI (minimal but functional)
In the existing admin dashboard:

Add Shipping section to the Order Detail page:

Show current shipments (status, carrier, service, tracking link, label download).

Button: "Get Rates" → calls /api/shipping/rates and lists options.

Button per rate: "Buy Label" → calls /api/shipping/labels.

Button per shipment: "Void Label" (only if eligible).

Add Settings → Packages page:

CRUD for shipping_packages with validation; allow marking one as default.

Ensure all UI uses server actions or fetch to server routes; NO client exposure of tokens.

Returns (basic)
Add API POST /app/api/shipping/returns:

Input: { orderId, reason, items: [{orderItemId, qty}] }

For now, generate a return label using the same address swapped (to=warehouse, from=customer).

Create a shipments row with status='purchased' and carrier/service noted as return.

(Refund logic remains in Stripe; do not implement here.)

Emails/notifications
On label purchase: send customer email with tracking link (reuse your existing email system).

On tracking update webhook: if status changes to TRANSIT or DELIVERED, send email.

Keep notification code behind a service: lib/notify.ts (so it’s easy to swap).

Security & correctness
All APIs: rate-limit (basic in-memory or middleware), require admin session for label endpoints.

Use Zod to validate all request bodies.

Add idempotency keys on label purchase (client generates a UUID passed via header; store in shipment_events or a dedicated table to prevent duplicate purchases).

Good error messages in JSON, no stack leaks.

Tests / manual verification
Seed one shipping_packages row as default (e.g., 20×15×10 cm, 100g).

Seed one order with a US address and two line items with weights.

Manual flow:

Admin → Order → Get Rates → see USPS/UPS options.

Buy Label → link to PDF prints.

Webhook simulator: POST a sample tracking event to the webhook route → UI shows delivered.

Provide a short README-shippo.md with:

required env vars,

how to run migrations,

test instructions,

how to add more carriers/services (it’s automatic via Shippo).

Acceptance criteria
I can buy/void a label and see a PDF/URL without leaving the admin.

Tracking number + status appear on the order page; updates via webhook change status.

No secrets in the client bundle.

Schema + endpoints compiled and type-checked; happy-path e2e works locally.

Proceed to:

Install deps and scaffold lib/env.ts, lib/shippo.ts.

Write Supabase migration with the specified tables and indexes.

Implement the three APIs: rates, buy label, void label; then the webhook.

Add the admin UI pieces.

Provide README-shippo.md.

Make small, coherent commits with messages like:

feat(shippo): add migrations for shipments and packages

feat(shippo): server lib + rate quote endpoint

feat(admin): order shipping UI + label purchase

feat(webhooks): shippo tracking + transaction handler

docs: README-shippo usage and env

When unsure about a field name in our existing schema, add a TODO with assumptions and proceed. Output all code diffs inline.
