-- Migration: Add training flag to orders for separating training/test datasets

-- Add a boolean flag to mark orders as part of a training dataset.
-- Idempotent: only adds if the column/index do not already exist.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_training boolean NOT NULL DEFAULT false;

-- Helpful for filtering/reporting
CREATE INDEX IF NOT EXISTS idx_orders_is_training ON orders(is_training);

COMMENT ON COLUMN orders.is_training IS 'Marks an order as part of training/test dataset; excluded from real reports when true.';

