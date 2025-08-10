-- Create a table for singleton store settings
CREATE TABLE IF NOT EXISTS store_settings (
  id INT PRIMARY KEY DEFAULT 1,
  -- Shipping origin address
  shipping_origin_name TEXT,
  shipping_origin_phone TEXT,
  shipping_origin_email TEXT,
  shipping_origin_address1 TEXT,
  shipping_origin_address2 TEXT,
  shipping_origin_city TEXT,
  shipping_origin_state TEXT,
  shipping_origin_postal_code TEXT,
  shipping_origin_country TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT singleton CHECK (id = 1)
);

-- Seed with current hardcoded values
INSERT INTO store_settings (
  id,
  shipping_origin_name,
  shipping_origin_phone,
  shipping_origin_email,
  shipping_origin_address1,
  shipping_origin_city,
  shipping_origin_state,
  shipping_origin_postal_code,
  shipping_origin_country
) VALUES (
  1,
  'Zevlin Warehouse',
  '123-456-7890',
  'shipping@zevlin.com',
  '123 Warehouse Rd',
  'Columbus',
  'OH',
  '43215',
  'US'
) ON CONFLICT (id) DO NOTHING;

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_store_settings_updated_at ON store_settings;
CREATE TRIGGER trg_store_settings_updated_at
BEFORE UPDATE ON store_settings
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();
