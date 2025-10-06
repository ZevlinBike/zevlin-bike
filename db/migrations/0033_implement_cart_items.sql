-- Implement and harden cart_items to match application usage
DO $$ BEGIN
  -- Ensure base table exists with required columns
  CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID NULL REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_cents INT NOT NULL CHECK (unit_price_cents >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- Bring existing schema up-to-date
ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS variant_id UUID NULL REFERENCES product_variants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unit_price_cents INT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Set NOT NULLs where required (assumes either empty or valid data)
DO $$ BEGIN
  PERFORM 1 FROM cart_items WHERE unit_price_cents IS NULL LIMIT 1;
  IF NOT FOUND THEN
    ALTER TABLE cart_items ALTER COLUMN unit_price_cents SET NOT NULL;
  ELSE
    -- Default any nulls to 0 then enforce NOT NULL
    UPDATE cart_items SET unit_price_cents = 0 WHERE unit_price_cents IS NULL;
    ALTER TABLE cart_items ALTER COLUMN unit_price_cents SET NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  PERFORM 1 FROM cart_items WHERE cart_id IS NULL OR product_id IS NULL OR quantity IS NULL LIMIT 1;
  IF NOT FOUND THEN
    ALTER TABLE cart_items ALTER COLUMN cart_id SET NOT NULL;
    ALTER TABLE cart_items ALTER COLUMN product_id SET NOT NULL;
    ALTER TABLE cart_items ALTER COLUMN quantity SET NOT NULL;
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Enforce 1 row per product (or variant) per cart
-- Use an expression unique index to treat NULL variant_id as a sentinel
DO $$ BEGIN
  CREATE UNIQUE INDEX ux_cart_items_cart_product_variant
    ON cart_items (cart_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid));
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- Enable RLS and policies (idempotent)
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow individual customer access to own cart items" ON cart_items;
CREATE POLICY "Allow individual customer access to own cart items" ON cart_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carts c
      WHERE c.id = cart_items.cart_id AND c.customer_id = get_customer_id_for_auth_user()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts c
      WHERE c.id = cart_items.cart_id AND c.customer_id = get_customer_id_for_auth_user()
    )
  );

