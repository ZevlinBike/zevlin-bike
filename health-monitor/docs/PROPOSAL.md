# Zevlin Bike Health Monitor — Proposal (Tailored)

Goal: Provide a visible, reliable, and automated signal for the health of key functional areas across the ecommerce site and admin dashboard. Start simple with a dashboard and on-demand checks; evolve to scheduled synthetic tests and alerts.

Principles
- Minimal friction to adopt: checks should run locally and in prod (feature‑flagged) without destructive side effects.
- Tailored to our domain: reflect our schemas and real flows (orders, shipments, emails, webhooks, content).
- Actionable output: each failure links to where to fix (env, table, route, library).
- Safe-by-default: use test keys or dry‑run modes; mark synthetic data with flags (e.g., `orders.is_training`).

What We’ll Monitor (mapped to code and schemas)
- Env & Connectivity
  - Env presence and formats via `lib/env.ts` (Stripe, Shippo, Brevo, Supabase, webhook secrets).
  - Supabase availability: basic select on `products`, `orders` with RLS contexts (anon vs. service role).
  - Background webhooks: Stripe `/api/webhooks/stripe` and Shippo `/api/webhooks/shippo` reachable and secrets configured.

- Catalog Integrity (lib/schema.ts: Product, ProductVariant, ProductImage, ProductCategoryRow)
  - Slug uniqueness (products, categories).
  - Featured/primary image existence for products.
  - Price rules: product.variant overrides sensible; non-negative prices.
  - Inventory invariants: `quantity_in_stock` non-negative; variants’ `inventory` non-negative.
  - Shipping data completeness: weight/size present when shippable.

- Checkout & Orders (app/checkout/actions.ts)
  - Address validation path via Shippo (`/api/shipping/validate-address`) responds + normalizes.
  - Payment intent creation (Stripe test key): creates PI and returns client secret.
  - Finalize order: creates `orders`, `line_items`, `shipping_details`, sets statuses; idempotency on retry.
  - Stock decrement via `rpc('decrement_stock')` fires and never goes negative; alert if fails.
  - Admin notifications (Brevo) enqueue without fatal errors when configured.

- Payments (Stripe)
  - Ability to create a PaymentIntent with test key; metadata attached (customer/cart snapshot) stays < 500 chars.
  - Webhook ingestion: dedupe by `external_event_id`, payment status transition ⇒ `orders.payment_status='paid'`.

- Shipping (Shippo via lib/shippo.ts)
  - Rate shopping returns carriers/services with sane prices; handle missing token gracefully.
  - Label purchase (test tokens): returns label URL and tracking number (dry‑run or sandbox only).
  - Label retrieval by transaction id returns a URL when available.
  - Webhook processing updates `shipments.status` and cascades to `orders.shipping_status` for delivered.

- Refunds & Discounts
  - Refund flow creates rows and transitions `orders.status` appropriately; no over‑refunds.
  - Discount validation logic returns expected rule types (percentage/fixed) and calculates totals correctly.

- Content & Marketing
  - Blog posts (BlogPost) publish visibility; RSS and sitemap routes respond.
  - Newsletter signup enqueues entry (NewsletterSignup table) and optional email confirmation path.
  - Notifications (Notification) respect schedule windows and variants; at least one active promo can render.

- Admin & Roles
  - `hasAdminRole()` path: RPC `get_user_roles` resolves; RLS policies permit expected reads for admins.
  - Critical admin pages load (orders, fulfillment, refunds, analytics, testing page) and key actions respond.

Check Types & Status
- Types: `pass | warn | fail | skipped` with description, metrics, and optional remediation link.
- Categories: `env`, `db`, `catalog`, `checkout`, `payments`, `shipping`, `refunds`, `content`, `notifications`, `admin`.
- Execution: on-demand (button), schedule (cron), or event‑driven (after deploy).

Synthetic Test Flow (opt‑in, safe)
1) Seed: Read 1–2 real products; create a cart snapshot in memory.
2) Address validate: call `/api/shipping/validate-address` with a canonical test address.
3) Create PI (Stripe test key): amount from computed totals.
4) Finalize Order (training): call `finalizeOrder(..., { isTraining: true })` to write order shards.
5) Rates & Label: call `/api/shipping/rates` and optionally `/api/shipping/labels` (Shippo test tokens only).
6) Assertions: verify statuses, `orders` rows, `line_items`, `shipping_details`, optional `shipments` row; confirm not negative inventory.
7) Cleanup: mark `orders.is_training=true`; optionally auto‑void labels and skip email to real customers.

UI/UX
- Dashboard cards per category showing last run time, counts, and latest error.
- Drilled detail view listing individual checks and raw messages.
- Manual trigger controls: run all / run category / run single check.

Rollout Plan
Phase 1 (this branch)
- Scaffold checks API (in this directory) and typed registry.
- Build minimal UI components (StatusBadge, HealthCard) not yet mounted in the app.
- Add config for env presence, basic DB connect, and dry‑run shipping/payment checks.

Phase 2
- Admin page `/admin/health` that reads from the registry and executes server actions to run checks.
- Add persistence table `health_runs` to keep history (service‑role writes only).
- Add simple cron/scheduler (platform dependent) to run daily.

Phase 3
- Full synthetic pipeline test and selective auto‑cleanup.
- Alerting hooks (email via Brevo, Slack webhook).
- Extend invariants (e.g., orphaned images, variant SKU uniqueness, webhook dead letter queue).

Artifacts in this Scaffold
- `config/checks.ts`: check types and example configuration.
- `checks/registry.ts`: registry listing and placeholders wired to our domain.
- `checks/examples/*.ts`: stubs for Stripe, Shippo, Supabase, Orders.
- `components/*`: small UI pieces for a Health page when we wire it in.

Open Questions / Decisions
- Where to store run history? Suggest `health_runs` with JSON result, run_at, duration, environment.
- How to mark training data? Already supported via `orders.is_training`; extend for shipments if needed.
- How to avoid live emails? Use explicit flags or non‑production sender domains.
- Which platform cron? Vercel Cron or external scheduler hitting a protected route.

