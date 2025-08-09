export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded';
export type RsvpStatus = 'going' | 'not_going' | 'interested';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price_cents: number;
  slug: string;
  created_at?: string;
  product_images: ProductImage[];
  product_variants: ProductVariant[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text?: string;
  is_featured?: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price_cents?: number;
  sku?: string;
  inventory?: number;
  created_at?: string;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  auth_user_id?: string;
  created_at?: string;
}

export interface Order {
  id: string;
  customer_id?: string | null;
  status: OrderStatus;
  subtotal_cents: number;
  shipping_cost_cents: number;
  tax_cents: number;
  discount_cents: number;
  total_cents: number;
  stripe_payment_intent_id?: string | null;
  billing_name?: string | null;
  billing_address_line1?: string | null;
  billing_address_line2?: string | null;
  billing_city?: string | null;
  billing_state?: string | null;
  billing_postal_code?: string | null;
  billing_country?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type OrderWithLineItems = Order & {
  line_items: {
    quantity: number;
    products: {
      name: string;
      product_images: { url: string }[];
    } | null;
  }[];
};

export interface LineItem {
  id: string;
  order_id: string;
  product_id?: string;
  variant_id?: string;
  quantity: number;
  unit_price_cents: number;
  created_at?: string;
}

export interface Cart {
  id: string;
  customer_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id?: string;
  variant_id?: string;
  quantity: number;
  created_at?: string;
}

export interface ShippingDetails {
  id: string;
  order_id: string;
  name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  tracking_number?: string;
  shipping_provider?: string;
  shipped_at?: string;
  estimated_delivery?: string;
}

export interface StripeEvent {
  id: string;
  type?: string;
  payload?: JSON;
  received_at?: string;
}

export interface Review {
  id: string;
  product_id: string;
  customer_id?: string;
  rating: number;
  body?: string;
  created_at?: string;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  date_start?: string;
  date_end?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EventRsvp {
  id: string;
  event_id: string;
  customer_id: string;
  status: RsvpStatus;
  created_at?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  body: string;
  image_url?: string | null;
  author_name?: string | null;
  published: boolean;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSignup {
  id: string;
  email: string;
  subscribed_at?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  cta_label?: string | null;
  cta_url?: string | null;
  variant: "promo" | "info" | "success" | "warning" | "danger";
  priority: number;
  status: "draft" | "scheduled" | "published" | "expired" | "archived";
  starts_at: string; // ISO datetime string
  ends_at?: string | null; // ISO datetime string
  dismissible: boolean;
  rotation_group?: string | null;
  rotation_interval_ms: number;
  ticker: boolean;
  ticker_speed_px_s: number;
  style: Record<string, any>; // JSONB
  audience: string[];
  created_by?: string | null;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  deleted_at?: string | null; // ISO datetime string
};
