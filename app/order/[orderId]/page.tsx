import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import MainLayout from "@/components/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Customer, LineItem, Order, Product } from "@/lib/schema";
import { Badge } from "@/components/ui/badge";

type OrderDetails = Order & {
  customers: Customer | null;
  line_items: (LineItem & {
    products: Product | null;
  })[];
};

async function getOrderDetails(orderId: string): Promise<OrderDetails> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      customers (*),
      line_items (
        *,
        products (*)
      )
    `
    )
    .eq("id", orderId)
    .single();

  if (error || !data) {
    console.error("Error fetching order:", error);
    notFound();
  }

  return data as OrderDetails;
}

export default async function Page({ params }: { params: Promise<{ orderId:string }> }) {
  const resolvedParams = await params;
  const order = await getOrderDetails(resolvedParams.orderId);
  const customer = order.customers;
  
  return (
    <MainLayout>
      <div className="pt-40 min-h-screen text-gray-900 bg-white dark:text-white dark:bg-neutral-900 pb-20">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Order Confirmation</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Thank you for your purchase!</p>
                </div>
                <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                  {order.status}
                </Badge>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
