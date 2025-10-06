-- Invoices and invoice_items tables for admin-created payable invoices

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft', 'pending', 'paid', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT,
  note TEXT,
  status invoice_status NOT NULL DEFAULT 'pending',
  suggested_total_cents INTEGER NOT NULL DEFAULT 0,
  final_total_cents INTEGER NOT NULL DEFAULT 0,
  stripe_payment_intent_id TEXT UNIQUE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Timestamps trigger
DROP TRIGGER IF EXISTS set_timestamp_on_invoices ON invoices;
CREATE TRIGGER set_timestamp_on_invoices
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Enable RLS and grant admin access
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access on invoices" ON invoices;
CREATE POLICY "Admin full access on invoices" ON invoices FOR ALL TO authenticated USING ('admin' = ANY(get_roles_for_auth_user())) WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

DROP POLICY IF EXISTS "Admin full access on invoice_items" ON invoice_items;
CREATE POLICY "Admin full access on invoice_items" ON invoice_items FOR ALL TO authenticated USING ('admin' = ANY(get_roles_for_auth_user())) WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

