-- Extend reviews table with additional fields and tighten RLS for authorized reviewers
-- Also recreate the reviews table if it was accidentally dropped.
-- Safe to run multiple times due to existence guards.

-- 0) Recreate base reviews table if missing (original schema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reviews'
  ) THEN
    CREATE TABLE reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      body TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;
END
$$;

-- 1) Add new columns if missing
DO $$ BEGIN
  ALTER TABLE reviews ADD COLUMN IF NOT EXISTS title TEXT;
  ALTER TABLE reviews ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
  ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
  ALTER TABLE reviews ADD COLUMN IF NOT EXISTS author_display TEXT;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- 2) Ensure a reviewer can only leave one review per product
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'reviews'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'reviews_unique_customer_product'
    ) THEN
      ALTER TABLE reviews ADD CONSTRAINT reviews_unique_customer_product UNIQUE (product_id, customer_id);
    END IF;
  END IF;
END
$$;

-- 3) Helper: determine if current auth user (via mapped customer) purchased the product
CREATE OR REPLACE FUNCTION can_current_customer_review(_product_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM customers c
    JOIN orders o ON o.customer_id = c.id
    JOIN line_items li ON li.order_id = o.id
    WHERE c.id = get_customer_id_for_auth_user()
      AND li.product_id = _product_id
      AND o.status IN ('paid', 'fulfilled')
  );
$$;

-- 4) Trigger to auto-set verified flag if reviewer purchased the product
CREATE OR REPLACE FUNCTION set_review_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF can_current_customer_review(NEW.product_id) THEN
    NEW.verified := true;
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS trg_set_review_verified ON reviews;
  CREATE TRIGGER trg_set_review_verified
  BEFORE INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE PROCEDURE set_review_verified();
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- 5) RLS: tighten policies (public read, author write/delete, admin full)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies if present
DROP POLICY IF EXISTS "Allow users to manage their own reviews" ON reviews;
DROP POLICY IF EXISTS "Allow admin full access on reviews" ON reviews;

-- Public read
DROP POLICY IF EXISTS "reviews_public_read" ON reviews;
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT TO public USING (true);

-- Author can insert their own review if authorized
DROP POLICY IF EXISTS "reviews_author_insert" ON reviews;
CREATE POLICY "reviews_author_insert" ON reviews FOR INSERT TO authenticated
WITH CHECK (
  customer_id = get_customer_id_for_auth_user()
  AND can_current_customer_review(product_id)
);

-- Author can update/delete own reviews
DROP POLICY IF EXISTS "reviews_author_update" ON reviews;
CREATE POLICY "reviews_author_update" ON reviews FOR UPDATE TO authenticated USING (
  customer_id = get_customer_id_for_auth_user()
) WITH CHECK (
  customer_id = get_customer_id_for_auth_user()
);

DROP POLICY IF EXISTS "reviews_author_delete" ON reviews;
CREATE POLICY "reviews_author_delete" ON reviews FOR DELETE TO authenticated USING (
  customer_id = get_customer_id_for_auth_user()
);

-- Admin full access
DROP POLICY IF EXISTS "reviews_admin_all" ON reviews;
CREATE POLICY "reviews_admin_all" ON reviews FOR ALL TO authenticated USING (
  'admin' = ANY(get_roles_for_auth_user())
) WITH CHECK (
  'admin' = ANY(get_roles_for_auth_user())
);

-- 6) Public function to fetch reviews with author names (first + last)
--    SECURITY DEFINER to allow join to customers despite RLS, but returns
--    only minimal, non-sensitive fields.
CREATE OR REPLACE FUNCTION get_reviews_with_authors(_product_id UUID)
RETURNS TABLE (
  id UUID,
  product_id UUID,
  customer_id UUID,
  rating INTEGER,
  title TEXT,
  body TEXT,
  verified BOOLEAN,
  helpful_count INTEGER,
  created_at TIMESTAMPTZ,
  author_first_name TEXT,
  author_last_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.id, r.product_id, r.customer_id, r.rating, r.title, r.body, r.verified, r.helpful_count, r.created_at,
    c.first_name AS author_first_name,
    c.last_name  AS author_last_name
  FROM reviews r
  LEFT JOIN customers c ON c.id = r.customer_id
  WHERE r.product_id = _product_id
  ORDER BY r.created_at DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION get_reviews_with_authors(UUID) TO anon, authenticated;

-- 7) Populate and maintain author_display for public listings without joining customers at read time
CREATE OR REPLACE FUNCTION set_review_author_display()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  fn TEXT;
  ln TEXT;
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    SELECT first_name, last_name INTO fn, ln FROM customers WHERE id = NEW.customer_id;
    IF COALESCE(fn, '') <> '' OR COALESCE(ln, '') <> '' THEN
      NEW.author_display := trim(both ' ' FROM CONCAT(fn, ' ', CASE WHEN COALESCE(ln, '') <> '' THEN SUBSTRING(ln FROM 1 FOR 1) || '.' ELSE '' END));
    ELSE
      NEW.author_display := 'Customer';
    END IF;
  ELSE
    NEW.author_display := 'Customer';
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS trg_set_review_author_display ON reviews;
  CREATE TRIGGER trg_set_review_author_display
  BEFORE INSERT OR UPDATE OF customer_id ON reviews
  FOR EACH ROW
  EXECUTE PROCEDURE set_review_author_display();
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Backfill display names for existing rows
DO $$ BEGIN
  UPDATE reviews r
  SET author_display = trim(both ' ' FROM CONCAT(c.first_name, ' ', CASE WHEN COALESCE(c.last_name, '') <> '' THEN SUBSTRING(c.last_name FROM 1 FOR 1) || '.' ELSE '' END))
  FROM customers c
  WHERE r.customer_id = c.id AND (r.author_display IS NULL OR r.author_display = '');
  UPDATE reviews r SET author_display = 'Customer' WHERE author_display IS NULL OR author_display = '';
EXCEPTION WHEN undefined_table THEN NULL; END $$;
