-- Migration: Add Row Level Security (RLS) to remaining tables

-- 1. User Roles and Roles Table (Admin only)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin full access on user_roles" ON user_roles;
CREATE POLICY "Allow admin full access on user_roles" ON user_roles FOR ALL TO authenticated USING ('admin' = ANY(get_roles_for_auth_user())) WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin full access on roles" ON roles;
CREATE POLICY "Allow admin full access on roles" ON roles FOR ALL TO authenticated USING ('admin' = ANY(get_roles_for_auth_user())) WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

-- 2. Stripe Events (Admin only)
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin read access on stripe_events" ON stripe_events;
CREATE POLICY "Allow admin read access on stripe_events" ON stripe_events FOR SELECT TO authenticated USING ('admin' = ANY(get_roles_for_auth_user()));

-- 3. Shipment Events (Admin only)
ALTER TABLE shipment_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin read access on shipment_events" ON shipment_events;
CREATE POLICY "Allow admin read access on shipment_events" ON shipment_events FOR SELECT TO authenticated USING ('admin' = ANY(get_roles_for_auth_user()));

-- 4. Reviews (User-specific and Admin access)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to manage their own reviews" ON reviews;
CREATE POLICY "Allow users to manage their own reviews" ON reviews FOR ALL TO authenticated USING (customer_id = get_customer_id_for_auth_user());
DROP POLICY IF EXISTS "Allow admin full access on reviews" ON reviews;
CREATE POLICY "Allow admin full access on reviews" ON reviews FOR ALL TO authenticated USING ('admin' = ANY(get_roles_for_auth_user())) WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));

-- 5. Product Images (Public Read, Admin Write)
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on product_images" ON product_images;
CREATE POLICY "Allow public read access on product_images" ON product_images FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow admin full access on product_images" ON product_images;
CREATE POLICY "Allow admin full access on product_images" ON product_images FOR ALL TO authenticated USING ('admin' = ANY(get_roles_for_auth_user())) WITH CHECK ('admin' = ANY(get_roles_for_auth_user()));



-- 7. Newsletter Signups (Admin only)
ALTER TABLE newsletter_signups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin read access on newsletter_signups" ON newsletter_signups;
CREATE POLICY "Allow admin read access on newsletter_signups" ON newsletter_signups FOR SELECT TO authenticated USING ('admin' = ANY(get_roles_for_auth_user()));

-- 8. Carts and Cart Items (User-specific access)
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to access their own cart" ON carts;
CREATE POLICY "Allow users to access their own cart" ON carts FOR ALL TO authenticated USING (customer_id = get_customer_id_for_auth_user());

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to access their own cart_items" ON cart_items;
CREATE POLICY "Allow users to access their own cart_items" ON cart_items FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.customer_id = get_customer_id_for_auth_user()
  )
);
