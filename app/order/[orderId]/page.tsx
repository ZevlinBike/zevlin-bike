import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import MainLayout from "@/components/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Customer, LineItem, Order, Product } from "@/lib/schema";

type OrderDetails = Order & {
  customers: Customer[];
  line_items: (LineItem & {
    products: Product[];
  })[];
};

async function getOrderDetails(orderId: string): Promise<OrderDetails> {
  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      total_cents,
      created_at,
      status,
      customers (id, first_name, last_name, email),
      line_items (
        id,
        quantity,
        unit_price_cents,
        products (id, name, description)
      )
    `
    )
    .eq("id", orderId)
    .single();

  if (error || !order) {
    console.error("Error fetching order:", error);
    notFound();
  }

  return order as OrderDetails;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function Page({ params }: any) {
  const order = await getOrderDetails(params.orderId);

  return (
    <MainLayout>
      <div className="pt-40 min-h-screen text-gray-900 bg-white dark:text-white dark:bg-neutral-900 pb-20">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Order Confirmation</CardTitle>
                <p className="text-sm text-gray-500">Thank you for your purchase!</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold">Order Details</h3>
                  <p>Order ID: {order.id}</p>
                  <p>Order Date: {new Date(order.created_at!).toLocaleDateString()}</p>
                  <p>Total: ${(order.total_cents / 100).toFixed(2)}</p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold">Customer Information</h3>
                  {order.customers.length > 0 ? (
                    <>
                      <p>Name: {order.customers[0].first_name} {order.customers[0].last_name}</p>
                      <p>Email: {order.customers[0].email}</p>
                    </>
                  ) : (
                    <p>No customer information available.</p>
                  )}
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold">Items Ordered</h3>
                  <ul className="space-y-4">
                    {order.line_items.map((item) => (
                      <li key={item.id} className="flex justify-between">
                        <div>
                          <p className="font-medium">{item.products.length > 0 ? item.products[0].name : 'Product not found'}</p>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                        <p>${((item.unit_price_cents / 100) * item.quantity).toFixed(2)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
