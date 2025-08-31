-- Migration: Add RLS for product_categories (Public Read, Admin Write)

-- Enable Row Level Security on product_categories
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Ensure a clean slate for policies
DROP POLICY IF EXISTS "Allow public read access on product_categories" ON product_categories;
DROP POLICY IF EXISTS "Allow admin full access on product_categories" ON product_categories;

-- Public can read categories
CREATE POLICY "Allow public read access on product_categories"
ON product_categories FOR SELECT
TO public
USING (true);

-- Admins can perform all actions
CREATE POLICY "Allow admin full access on product_categories"
ON product_categories FOR ALL
TO authenticated
USING ('admin' = ANY(get_roles_for_auth_user()))
WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

