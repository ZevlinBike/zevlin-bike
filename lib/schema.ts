
export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded';
export type RsvpStatus = 'going' | 'not_going' | 'interested';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price_cents: number;
  slug: string;
  created_at?: string;
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
  customer_id?: string;
  status: OrderStatus;
  total_cents: number;
  created_at?: string;
}

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
  excerpt?: string;
  body: string;
  image_url?: string;
  author_name?: string;
  published?: boolean;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NewsletterSignup {
  id: string;
  email: string;
  subscribed_at?: string;
}
