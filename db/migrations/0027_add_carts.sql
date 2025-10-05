-- Carts for authenticated users; snapshot of items pre‑order
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_cents INT NOT NULL CHECK (unit_price_cents >= 0),
    UNIQUE (cart_id, product_id)
  );
  CREATE INDEX IF NOT EXISTS idx_carts_customer_id ON carts(customer_id);
  CREATE TRIGGER set_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

  -- RLS: mirror orders policy style
  ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Allow individual customer access to own cart" ON carts;
  CREATE POLICY "Allow individual customer access to own cart" ON carts
    FOR ALL TO authenticated
    USING (customer_id = get_customer_id_for_auth_user())
    WITH CHECK (customer_id = get_customer_id_for_auth_user());

  DROP POLICY IF EXISTS "Allow individual customer access to own cart items" ON cart_items;
  CREATE POLICY "Allow individual customer access to own cart items" ON cart_items
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM carts c WHERE c.id = cart_items.cart_id AND c.customer_id = get_customer_id_for_auth_user()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM carts c WHERE c.id = cart_items.cart_id AND c.customer_id = get_customer_id_for_auth_user()
      )
    );
END $$;

