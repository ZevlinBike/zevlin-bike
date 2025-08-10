-- Shippo integration: packages, shipments, events, and admin helper
-- This migration adds:
-- - shipping_packages (preset boxes)
-- - shipments (per-order labels + tracking)
-- - shipment_events (webhook and internal audit trail)
-- - webhook_events (idempotency for external events)
-- - admin_get_order_with_shipments(order_id) helper (JSON aggregate for admin UI)

-- shipping_packages: preset dimensional data
CREATE TABLE IF NOT EXISTS shipping_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  length_cm NUMERIC NOT NULL,
  width_cm NUMERIC NOT NULL,
  height_cm NUMERIC NOT NULL,
  weight_g INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT shipping_packages_name_unique UNIQUE (name)
);

-- Optional: ensure only one default package
CREATE UNIQUE INDEX IF NOT EXISTS shipping_packages_one_default
ON shipping_packages ((CASE WHEN is_default THEN 1 ELSE NULL END));

CREATE TRIGGER set_shipping_packages_updated_at
BEFORE UPDATE ON shipping_packages
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- shipments: label + tracking per order
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  carrier TEXT,
  service TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  label_url TEXT,

  rate_object_id TEXT,         -- Shippo rate id
  label_object_id TEXT,        -- Shippo transaction id

  price_amount_cents INTEGER,
  price_currency TEXT DEFAULT 'USD',

  status TEXT NOT NULL DEFAULT 'pending', -- pending|purchased|voided|error|delivered

  -- To address
  to_name TEXT,
  to_phone TEXT,
  to_email TEXT,
  to_address1 TEXT,
  to_address2 TEXT,
  to_city TEXT,
  to_state TEXT,
  to_postal_code TEXT,
  to_country TEXT,

  -- From address
  from_name TEXT,
  from_phone TEXT,
  from_email TEXT,
  from_address1 TEXT,
  from_address2 TEXT,
  from_city TEXT,
  from_state TEXT,
  from_postal_code TEXT,
  from_country TEXT,

  package_name TEXT,

  -- Actual parcel used
  weight_g INTEGER NOT NULL,
  length_cm NUMERIC NOT NULL,
  width_cm NUMERIC NOT NULL,
  height_cm NUMERIC NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shipments_by_order ON shipments(order_id);
CREATE INDEX IF NOT EXISTS shipments_by_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS shipments_by_status ON shipments(status);

CREATE TRIGGER set_shipments_updated_at
BEFORE UPDATE ON shipments
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- shipment_events: timeline + webhook receipts
CREATE TABLE IF NOT EXISTS shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  event_code TEXT,
  description TEXT,
  raw JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shipment_events_by_shipment_time
ON shipment_events (shipment_id, occurred_at DESC);

-- webhook_events: idempotency for Shippo webhooks (and future providers)
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'shippo',
  external_event_id TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw JSONB,
  CONSTRAINT webhook_events_unique_external UNIQUE (external_event_id)
);

-- Helper: fetch an order with its items and shipments for admin UI
CREATE OR REPLACE FUNCTION admin_get_order_with_shipments(p_order_id UUID)
RETURNS JSONB
LANGUAGE sql
AS $$
  WITH oi AS (
    SELECT li.id,
           li.quantity,
           li.unit_price_cents,
           p.name AS product_name
    FROM line_items li
    LEFT JOIN products p ON p.id = li.product_id
    WHERE li.order_id = p_order_id
  ), sh AS (
    SELECT s.*
    FROM shipments s
    WHERE s.order_id = p_order_id
  )
  SELECT jsonb_build_object(
    'order', to_jsonb(o.*),
    'customer', to_jsonb(c.*),
    'line_items', COALESCE((SELECT jsonb_agg(to_jsonb(oi.*)) FROM oi), '[]'::jsonb),
    'shipments', COALESCE((SELECT jsonb_agg(to_jsonb(sh.*)) FROM sh), '[]'::jsonb)
  )
  FROM orders o
  LEFT JOIN customers c ON c.id = o.customer_id
  WHERE o.id = p_order_id;
$$;

COMMENT ON FUNCTION admin_get_order_with_shipments(UUID) IS 'Aggregate order + customer + line_items + shipments as JSON for admin display';

