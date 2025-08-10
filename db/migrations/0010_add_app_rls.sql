-- Migration: Add Row Level Security (RLS) to core application tables

-- Helper function to get the customer_id from the currently authenticated user
CREATE OR REPLACE FUNCTION get_customer_id_for_auth_user()
RETURNS UUID AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE auth_user_id = auth.uid();
  RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Products, Variants, and Categories (Public Read, Admin Write)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on products" ON products;
CREATE POLICY "Allow public read access on products" ON products FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow admin full access on products" ON products;
CREATE POLICY "Allow admin full access on products" ON products FOR ALL TO authenticated USING ('admin' = ANY(get_roles_for_auth_user())) WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on product_variants" ON product_variants;
CREATE POLICY "Allow public read access on product_variants" ON product_variants FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow admin full access on product_variants" ON product_variants;
CREATE POLICY "Allow admin full access on product_variants" ON product_variants FOR ALL TO authenticated USING ('admin' = ANY(get_roles_for_auth_user())) WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

-- 2. Customers (Users can only see/edit themselves, Admins see all)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual customer access to their own record" ON customers;
CREATE POLICY "Allow individual customer access to their own record" ON customers FOR ALL TO authenticated USING (id = get_customer_id_for_auth_user());
DROP POLICY IF EXISTS "Allow admin full access on customers" ON customers;
CREATE POLICY "Allow admin full access on customers" ON customers FOR ALL TO authenticated USING ('admin' = ANY(get_roles_for_auth_user())) WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

-- 3. Orders and Line Items (Users see their own, Admins see all)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual customer access to their own orders" ON orders;
CREATE POLICY "Allow individual customer access to their own orders" ON orders FOR ALL TO authenticated USING (customer_id = get_customer_id_for_auth_user());
DROP POLICY IF EXISTS "Allow admin full access on orders" ON orders;
CREATE POLICY "Allow admin full access on orders" ON orders FOR ALL TO authenticated USING ('admin' = ANY(get_roles_for_auth_user())) WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual customer access to their own line_items" ON line_items;
CREATE POLICY "Allow individual customer access to their own line_items" ON line_items FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = line_items.order_id AND orders.customer_id = get_customer_id_for_auth_user()
  )
);
DROP POLICY IF EXISTS "Allow admin full access on line_items" ON line_items;
CREATE POLICY "Allow admin full access on line_items" ON line_items FOR ALL TO authenticated USING ('admin' = ANY(get_roles_for_auth_user())) WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

-- 4. Shipping Details and Shipments (Users see their own, Admins see all)
ALTER TABLE shipping_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual customer access to their own shipping_details" ON shipping_details;
CREATE POLICY "Allow individual customer access to their own shipping_details" ON shipping_details FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = shipping_details.order_id AND orders.customer_id = get_customer_id_for_auth_user()
  )
);
DROP POLICY IF EXISTS "Allow admin full access on shipping_details" ON shipping_details;
CREATE POLICY "Allow admin full access on shipping_details" ON shipping_details FOR ALL TO authenticated USING ('admin' = ANY(get_roles_for_auth_user())) WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual customer access to their own shipments" ON shipments;
CREATE POLICY "Allow individual customer access to their own shipments" ON shipments FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = shipments.order_id AND orders.customer_id = get_customer_id_for_auth_user()
  )
);
DROP POLICY IF EXISTS "Allow admin full access on shipments" ON shipments;
CREATE POLICY "Allow admin full access on shipments" ON shipments FOR ALL TO authenticated USING ('admin' = ANY(get_roles_for_auth_user())) WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

-- 5. Settings and Packages (Admin only)
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin full access on store_settings" ON store_settings;
CREATE POLICY "Allow admin full access on store_settings" ON store_settings FOR ALL TO authenticated USING ('admin' = ANY(get_roles_for_auth_user())) WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

ALTER TABLE shipping_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin full access on shipping_packages" ON shipping_packages;
CREATE POLICY "Allow admin full access on shipping_packages" ON shipping_packages FOR ALL TO authenticated USING ('admin' = ANY(get_roles_for_auth_user())) WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

-- 6. Blog and Announcements (Public Read, Admin Write)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on blog_posts" ON blog_posts;
CREATE POLICY "Allow public read access on blog_posts" ON blog_posts FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow admin full access on blog_posts" ON blog_posts;
CREATE POLICY "Allow admin full access on blog_posts" ON blog_posts FOR ALL TO authenticated USING ('admin' = ANY(get_roles_for_auth_user())) WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on announcements" ON announcements;
CREATE POLICY "Allow public read access on announcements" ON announcements FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow admin full access on announcements" ON announcements;
CREATE POLICY "Allow admin full access on announcements" ON announcements FOR ALL TO authenticated USING ('admin' = ANY(get_roles_for_auth_user())) WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));
