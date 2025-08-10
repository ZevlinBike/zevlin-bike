-- Drop old trigger & function
DROP TRIGGER IF EXISTS trg_sync_legacy_order_status_ins ON orders;
DROP TRIGGER IF EXISTS trg_sync_legacy_order_status_upd ON orders;
DROP FUNCTION IF EXISTS sync_legacy_order_status();

-- Enums (create if missing)
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending','paid','partially_refunded','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_fulfillment_status AS ENUM ('pending_payment','pending_fulfillment','fulfilled','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_shipping_status AS ENUM ('not_shipped','shipped','delivered','returned','lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure columns exist
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status payment_status DEFAULT 'pending' NOT NULL,
  ADD COLUMN IF NOT EXISTS order_status order_fulfillment_status DEFAULT 'pending_payment' NOT NULL,
  ADD COLUMN IF NOT EXISTS shipping_status order_shipping_status DEFAULT 'not_shipped' NOT NULL;

-- Force overwrite backfill from legacy status
UPDATE orders SET
  payment_status = CASE status
    WHEN 'paid' THEN 'paid'
    WHEN 'fulfilled' THEN 'paid'
    WHEN 'refunded' THEN 'refunded'
    WHEN 'cancelled' THEN 'pending'
    ELSE 'pending'
  END,
  order_status = CASE status
    WHEN 'paid' THEN 'pending_fulfillment'
    WHEN 'fulfilled' THEN 'fulfilled'
    WHEN 'cancelled' THEN 'cancelled'
    WHEN 'refunded' THEN 'cancelled'
    ELSE 'pending_payment'
  END,
  shipping_status = CASE status
    WHEN 'fulfilled' THEN 'shipped'
    ELSE 'not_shipped'
  END;

-- New trigger function to sync legacy column from new statuses
CREATE OR REPLACE FUNCTION sync_legacy_order_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_status = 'cancelled' THEN
    NEW.status := 'cancelled';
  ELSIF NEW.payment_status = 'refunded' THEN
    NEW.status := 'refunded';
  ELSIF NEW.order_status = 'fulfilled' THEN
    NEW.status := 'fulfilled';
  ELSIF NEW.payment_status = 'paid' THEN
    NEW.status := 'paid';
  ELSE
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
CREATE TRIGGER trg_sync_legacy_order_status_ins
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION sync_legacy_order_status();

CREATE TRIGGER trg_sync_legacy_order_status_upd
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION sync_legacy_order_status();

-- Comments
COMMENT ON COLUMN orders.payment_status IS 'Split from orders.status; tracks payment lifecycle';
COMMENT ON COLUMN orders.order_status IS 'Split from orders.status; tracks fulfillment workflow';
COMMENT ON COLUMN orders.shipping_status IS 'Split from orders.status; tracks shipping lifecycle';

