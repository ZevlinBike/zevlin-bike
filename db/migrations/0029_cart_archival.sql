DO $$ BEGIN
  ALTER TABLE carts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
  ALTER TABLE carts ADD COLUMN IF NOT EXISTS order_id uuid NULL REFERENCES orders(id) ON DELETE SET NULL;
  ALTER TABLE carts ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL;
  CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);
  CREATE INDEX IF NOT EXISTS idx_carts_order_id ON carts(order_id);
END $$;

