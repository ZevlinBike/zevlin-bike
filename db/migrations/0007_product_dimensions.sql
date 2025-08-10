-- Add weight and dimensions to products and product_variants

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS weight_g INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS length_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS width_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC;

ALTER TABLE products
  ADD CONSTRAINT products_weight_g_nonnegative CHECK (weight_g >= 0);

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS weight_g INTEGER,
  ADD COLUMN IF NOT EXISTS length_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS width_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC;

ALTER TABLE product_variants
  ADD CONSTRAINT product_variants_weight_g_nonnegative CHECK (weight_g IS NULL OR weight_g >= 0);

COMMENT ON COLUMN products.weight_g IS 'Default weight for the product in grams; used if variant weight is null';
COMMENT ON COLUMN products.length_cm IS 'Optional product length in centimeters';
COMMENT ON COLUMN products.width_cm IS 'Optional product width in centimeters';
COMMENT ON COLUMN products.height_cm IS 'Optional product height in centimeters';
COMMENT ON COLUMN product_variants.weight_g IS 'Optional override weight for the variant in grams';
COMMENT ON COLUMN product_variants.length_cm IS 'Optional variant length in centimeters';
COMMENT ON COLUMN product_variants.width_cm IS 'Optional variant width in centimeters';
COMMENT ON COLUMN product_variants.height_cm IS 'Optional variant height in centimeters';

