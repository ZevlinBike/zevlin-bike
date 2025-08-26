-- Create product_categories table and add FK to products

CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  show_in_footer BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(active);
CREATE INDEX IF NOT EXISTS idx_product_categories_sort ON product_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_product_categories_footer ON product_categories(show_in_footer);

-- Add nullable FK to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Seed baseline categories (Creams and Limited Drops)
INSERT INTO product_categories (name, slug, sort_order, active, show_in_footer) VALUES
  ('Chamois Cream', 'cream', 1, TRUE, TRUE),
  ('Limited Drops', 'limited', 2, TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Backfill category_id for existing products based on previous enum/slug mappings
UPDATE products p
SET category_id = c.id
FROM product_categories c
WHERE c.slug = 'cream'
  AND (
    p.category::text = 'cream'
    OR p.slug IN ('crack-chamois-cream', 'super-crack-chamois-cream')
  );

UPDATE products p
SET category_id = c.id
FROM product_categories c
WHERE c.slug = 'limited'
  AND (
    p.category::text = 'limited'
    OR p.slug IN ('byot-towel', 'zevlin-gaiter')
  );

