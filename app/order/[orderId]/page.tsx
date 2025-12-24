import { createClient } from "@/lib/supabase/server";
import PageShell from "@/app/components/layouts/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Customer, LineItem, Order, Product } from "@/lib/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2, PartyPopper, Truck } from "lucide-react";

type ShipmentLite = {
  id: string;
  status: string;
  carrier: string | null;
  service: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  label_url: string | null;
  created_at?: string | null;
};

type ShippingDetailsRow = {
  id: string;
  name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
};

type OrderDetails = Order & {
  customers: Customer | null;
  line_items: (LineItem & { products: Product | null })[];
  shipping_details: ShippingDetailsRow[];
  shipments: ShipmentLite[];
  payment_status?: string | null;
  order_status?: string | null;
  shipping_status?: string | null;
};

async function getOrderDetailsForUser(orderId: string): Promise<OrderDetails | null> {
  const supabase = await createClient();

  // Require authentication for viewing order details
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // For guests, we won't redirect — we'll show a friendly confirmation shell
    return null;
  }

  // Fetch the order only if it belongs to the authenticated user
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      customers (*),
      line_items (
        *,
        products (*)
      ),
      shipping_details (*),
      shipments (id, status, carrier, service, tracking_number, tracking_url, label_url, created_at)
    `
    )
    .eq("id", orderId)
    .eq("customers.auth_user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    // If the order isn't accessible to this user, fall back to guest view
    return null;
  }

  return data as OrderDetails;
}

export default async function Page(ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  const order = await getOrderDetailsForUser(orderId);
  const customer = order?.customers ?? null;
  const shipping = order?.shipping_details?.[0] || null;
  const orderShort = orderId.substring(0, 8);
  const isPaid = order?.payment_status ? order.payment_status === 'paid' : (order?.status === 'paid');
  const fulfillment = order?.order_status ?? null;
  const shippingStatus = order?.shipping_status ?? null;
  
  const statusBadge = (() => {
    const value = shippingStatus || fulfillment || (order?.status ?? null);
    if (!value) return null;
    const pretty = String(value).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return <Badge variant="secondary" className="capitalize">{pretty}</Badge>;
  })();
  
  return (
    <PageShell>
      <div className="pt-40 min-h-screen text-gray-900 bg-white dark:text-white dark:bg-neutral-900 pb-20">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Celebration Header */}
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-emerald-100 via-white to-sky-100 dark:from-emerald-900/30 dark:via-neutral-900 dark:to-sky-900/20 border-emerald-200/60 dark:border-emerald-800/50">
              <div className="px-6 py-8 sm:px-8 sm:py-10">
                <div className="flex items-start gap-3">
                  <PartyPopper className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mt-1" />
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Congratulations — your order is in!</h1>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">We’ve sent a confirmation to your email. You’ll get shipping updates as soon as your order moves.</p>
                    <div className="mt-3 flex items-center gap-3 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Order</span>
                      <span className="font-mono px-2 py-0.5 rounded bg-white/60 dark:bg-neutral-800/60 border text-gray-900 dark:text-gray-100">#{orderShort}</span>
                      {statusBadge}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm text-emerald-800 dark:text-emerald-300">{isPaid ? 'Payment confirmed' : 'Payment processing'}</span>
                </div>
                {!order && (
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button asChild>
                      <Link href="/auth/login">Sign in to view details</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/">Continue shopping</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Details (shown only when user can view the order) */}
            {order && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Order Details</CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Placed on {new Date(order.created_at!).toLocaleDateString()}</p>
                  </div>
                  {statusBadge}
                </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Order Summary</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Order ID:</span> {order.id}</p>
                    <p><span className="font-medium">Order Date:</span> {new Date(order.created_at!).toLocaleDateString()}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Customer Information</h3>
                    {customer ? (
                      <div className="space-y-1 text-sm">
                        <p>{customer.first_name} {customer.last_name}</p>
                        <p>{customer.email}</p>
                        <p>{customer.phone}</p>
                      </div>
                    ) : (
                      <p className="text-sm">No customer information available.</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Billing Address</h3>
                    <div className="space-y-1 text-sm">
                      <p>{order.billing_name}</p>
                      <p>{order.billing_address_line1}</p>
                      {order.billing_address_line2 && <p>{order.billing_address_line2}</p>}
                      <p>{order.billing_city}, {order.billing_state} {order.billing_postal_code}</p>
                      <p>{order.billing_country}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    {shipping ? (
                      <div className="space-y-1 text-sm">
                        {shipping.name && <p>{shipping.name}</p>}
                        <p>{shipping.address_line1}</p>
                        {shipping.address_line2 && <p>{shipping.address_line2}</p>}
                        <p>{shipping.city}, {shipping.state} {shipping.postal_code}</p>
                        <p>{shipping.country}</p>
                      </div>
                    ) : (
                      <p className="text-sm">No shipping address on file.</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Shipping & Tracking</h3>
                    {order.shipments && order.shipments.length > 0 ? (
                      <ul className="space-y-3 text-sm">
                        {order.shipments.map((s) => (
                          <li key={s.id} className="rounded border p-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium capitalize">{s.status}</div>
                                <div className="text-gray-600 dark:text-gray-400">
                                  {(s.carrier || '').toUpperCase()} {s.service ? `· ${s.service}` : ''}
                                </div>
                                {s.tracking_number && (
                                  <div className="mt-1">
                                    <span className="font-medium">Tracking: </span>
                                    {s.tracking_url ? (
                                      <a href={s.tracking_url} className="underline" target="_blank" rel="noreferrer">{s.tracking_number}</a>
                                    ) : (
                                      <span>{s.tracking_number}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              {s.label_url && (
                                <a href={s.label_url} target="_blank" rel="noreferrer" className="underline">Label</a>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Truck className="h-4 w-4" />
                        <span>We’ll share tracking once your order ships.</span>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Items Ordered</h3>
                  <ul className="space-y-4">
                    {order.line_items.map((item) => (
                      <li key={item.id} className="flex justify-between items-center text-sm">
                        <div>
                          <p className="font-medium">{item.products?.name || 'Product not found'}</p>
                          <p className="text-gray-500 dark:text-gray-400">Quantity: {item.quantity}</p>
                        </div>
                        <p>${((item.unit_price_cents / 100) * item.quantity).toFixed(2)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Cost Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${(order.subtotal_cents / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>${(order.shipping_cost_cents / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${(order.tax_cents / 100).toFixed(2)}</span>
                    </div>
                    {order.discount_cents > 0 && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Discount</span>
                        <span>-${(order.discount_cents / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>${(order.total_cents / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <Button asChild variant="secondary">
                    <Link href={`/order/${orderId}/receipt`} target="_blank" rel="noreferrer">Print receipt</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/">Continue shopping</Link>
                  </Button>
                </div>
              </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
