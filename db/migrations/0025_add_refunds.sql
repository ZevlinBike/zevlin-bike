-- Migration: Add refunds table and RLS policies

-- 1) Enum for refund status
DO $$ BEGIN
  CREATE TYPE refund_status AS ENUM ('pending','approved','rejected','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status refund_status NOT NULL DEFAULT 'pending',
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  reason TEXT,
  admin_note TEXT,
  stripe_refund_id TEXT,
  reviewed_by_customer_id UUID REFERENCES customers(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE refunds IS 'Customer refund requests and admin decisions';
COMMENT ON COLUMN refunds.status IS 'pending | approved | rejected | cancelled';
COMMENT ON COLUMN refunds.reviewed_by_customer_id IS 'Admin customer id who reviewed the refund';

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_customer_id ON refunds(customer_id);

-- Ensure only one pending refund per order
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_refund_per_order
  ON refunds(order_id)
  WHERE status = 'pending';

-- 3) Row Level Security
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Customers: can see and create their own refunds (on their orders)
DROP POLICY IF EXISTS "Allow customers to read their refunds" ON refunds;
CREATE POLICY "Allow customers to read their refunds" ON refunds
  FOR SELECT TO authenticated
  USING (customer_id = get_customer_id_for_auth_user());

DROP POLICY IF EXISTS "Allow customers to create refunds on own orders" ON refunds;
CREATE POLICY "Allow customers to create refunds on own orders" ON refunds
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id = get_customer_id_for_auth_user()
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = refunds.order_id AND o.customer_id = get_customer_id_for_auth_user()
    )
  );

-- Allow customers to cancel their own pending refund (optional)
DROP POLICY IF EXISTS "Allow customers to cancel pending refunds" ON refunds;
CREATE POLICY "Allow customers to cancel pending refunds" ON refunds
  FOR UPDATE TO authenticated
  USING (
    customer_id = get_customer_id_for_auth_user() AND status = 'pending'
  )
  WITH CHECK (
    customer_id = get_customer_id_for_auth_user() AND status IN ('pending','cancelled')
  );

-- Admins: full access
DROP POLICY IF EXISTS "Allow admin full access on refunds" ON refunds;
CREATE POLICY "Allow admin full access on refunds" ON refunds
  FOR ALL TO authenticated
  USING ('admin' = ANY(get_roles_for_auth_user()))
  WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

-- 4) Simple trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refunds_set_updated_at ON refunds;
CREATE TRIGGER trg_refunds_set_updated_at
BEFORE UPDATE ON refunds
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

