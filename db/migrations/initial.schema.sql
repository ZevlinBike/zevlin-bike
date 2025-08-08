-- -------------------------------------
-- DROP EXISTING TYPES IF THEY EXIST
-- -------------------------------------
DO $$ BEGIN
  DROP TYPE IF EXISTS order_status CASCADE;
  DROP TYPE IF EXISTS rsvp_status CASCADE;
END $$;

-- -------------------------------------
-- ENUM TYPES
-- -------------------------------------
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded');
CREATE TYPE rsvp_status AS ENUM ('going', 'not_going', 'interested');

-- -------------------------------------
-- HELPER FUNCTIONS / TRIGGERS
-- -------------------------------------
DROP FUNCTION IF EXISTS trigger_set_timestamp CASCADE;

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------
-- DROP TABLES (REVERSE DEPENDENCY ORDER)
-- -------------------------------------
DROP TABLE IF EXISTS 
  newsletter_signups,
  blog_posts,
  event_rsvps,
  events,
  reviews,
  stripe_events,
  shipping_details,
  cart_items,
  carts,
  line_items,
  orders,
  customers,
  product_variants,
  product_images,
  products
CASCADE;

-- -------------------------------------
-- CORE TABLES
-- -------------------------------------
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  is_featured BOOLEAN DEFAULT false
);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_cents INTEGER,
  sku TEXT UNIQUE,
  inventory INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------
-- CUSTOMERS / AUTH / ORDERS
-- -------------------------------------
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'pending',
  subtotal_cents INTEGER NOT NULL,
  shipping_cost_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  billing_name TEXT,
  billing_address_line1 TEXT,
  billing_address_line2 TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_postal_code TEXT,
  billing_country TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------
-- CART (PRE-CHECKOUT)
-- -------------------------------------
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------
-- SHIPPING / FULFILLMENT
-- -------------------------------------
CREATE TABLE shipping_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  name TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  tracking_number TEXT,
  shipping_provider TEXT,
  shipped_at TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ
);

-- -------------------------------------
-- STRIPE EVENTS (WEBHOOK LOGGING)
-- -------------------------------------
CREATE TABLE stripe_events (
  id TEXT PRIMARY KEY,
  type TEXT,
  payload JSONB,
  received_at TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------
-- REVIEWS
-- -------------------------------------
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------
-- EVENTS + RSVPS
-- -------------------------------------
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  date_start TIMESTAMPTZ,
  date_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  status rsvp_status NOT NULL DEFAULT 'interested',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (event_id, customer_id)
);

-- -------------------------------------
-- BLOG / MARKETING
-- -------------------------------------
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,
  image_url TEXT,
  author_name TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------
-- NEWSLETTER SIGNUPS
-- -------------------------------------
CREATE TABLE newsletter_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------
-- TRIGGERS
-- -------------------------------------
CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_carts_updated_at
BEFORE UPDATE ON carts
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_blog_posts_updated_at
BEFORE UPDATE ON blog_posts
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

