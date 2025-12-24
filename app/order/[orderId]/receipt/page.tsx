import PrintOnMount from "./PrintOnMount";
import { createClient } from "@/lib/supabase/server";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Customer, LineItem, Order, Product } from "@/lib/schema";

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
  payment_status?: string | null;
  order_status?: string | null;
  shipping_status?: string | null;
};

async function getOrderDetailsForUser(orderId: string): Promise<OrderDetails | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      customers (*),
      line_items (*, products (*)),
      shipping_details (*)
    `)
    .eq("id", orderId)
    .eq("customers.auth_user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as OrderDetails;
}

export default async function Page(ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  const order = await getOrderDetailsForUser(orderId);

  if (!order) {
    // Graceful message when receipt isn't accessible
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 text-gray-900 dark:text-white p-6 print:p-0">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <h1 className="text-xl font-semibold">Receipt Unavailable</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Please sign in with the account used for this purchase to print your receipt.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const shipping = order.shipping_details?.[0] || null;
  const created = order.created_at ? new Date(order.created_at) : null;

  const currency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-white text-black p-6 print:p-0">
      <PrintOnMount />
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Zevlin Bike — Receipt</h1>
            <p className="text-sm text-gray-600">Order #{order.id.substring(0,8)}</p>
          </div>
          <div className="text-right text-sm text-gray-700">
            <div>Date: {created ? created.toLocaleDateString() : ''}</div>
            <div>Time: {created ? created.toLocaleTimeString() : ''}</div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="font-semibold">Billed To</div>
            <div className="mt-1 text-sm">
              <div>{order.billing_name}</div>
              <div>{order.billing_address_line1}</div>
              {order.billing_address_line2 && <div>{order.billing_address_line2}</div>}
              <div>{order.billing_city}, {order.billing_state} {order.billing_postal_code}</div>
              <div>{order.billing_country}</div>
            </div>
          </div>
          <div>
            <div className="font-semibold">Ship To</div>
            <div className="mt-1 text-sm">
              {shipping ? (
                <>
                  {shipping.name && <div>{shipping.name}</div>}
                  <div>{shipping.address_line1}</div>
                  {shipping.address_line2 && <div>{shipping.address_line2}</div>}
                  <div>{shipping.city}, {shipping.state} {shipping.postal_code}</div>
                  <div>{shipping.country}</div>
                </>
              ) : (
                <div>—</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left font-medium">Item</th>
                <th className="py-2 text-right font-medium">Qty</th>
                <th className="py-2 text-right font-medium">Unit</th>
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.line_items.map((li) => {
                const unit = li.unit_price_cents;
                const total = unit * li.quantity;
                return (
                  <tr key={li.id} className="border-b">
                    <td className="py-2 pr-3">{li.products?.name || 'Product'}</td>
                    <td className="py-2 text-right">{li.quantity}</td>
                    <td className="py-2 text-right">{currency(unit)}</td>
                    <td className="py-2 text-right">{currency(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 ml-auto w-full max-w-sm">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{currency(order.subtotal_cents)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>{currency(order.shipping_cost_cents)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>{currency(order.tax_cents)}</span>
          </div>
          {order.discount_cents > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{currency(order.discount_cents)}</span>
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{currency(order.total_cents)}</span>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-600">
          Thank you for your order! This receipt confirms your purchase with Zevlin Bike.
        </div>
      </div>
    </div>
  );
}

