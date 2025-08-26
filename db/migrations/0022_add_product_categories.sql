-- Add product categories and index, then backfill existing products

-- 1) Define an enum for product categories
DO $$ BEGIN
  CREATE TYPE product_category AS ENUM ('cream', 'apparel', 'limited');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Add nullable category column to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS category product_category;

-- 3) Helpful index for filtering by category
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- 4) Backfill known categories based on current slugs
UPDATE products SET category = 'cream'
WHERE slug IN ('crack-chamois-cream', 'super-crack-chamois-cream');

UPDATE products SET category = 'apparel'
WHERE slug IN ('byot-towel', 'zevlin-gaiter');

-- Note: leave other products as NULL so they still appear in "All Products"

